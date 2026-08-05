const OPENAI_API_URL = 'https://api.openai.com/v1/responses'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '30mb'
    }
  }
}

const FOOD_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['isFoodPhoto', 'items', 'summary'],
  properties: {
    isFoodPhoto: { type: 'boolean' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'portion', 'calories', 'protein', 'carbs', 'fat', 'sodium', 'sugar', 'confidence'],
        properties: {
          name: { type: 'string' },
          portion: { type: 'string' },
          calories: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
          sodium: { type: 'number' },
          sugar: { type: 'number' },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] }
        }
      }
    },
    summary: { type: 'string' }
  }
}

const sendJson = (res, status, body) => {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

const extractStructuredOutput = (data) => {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text
  }

  for (const outputItem of data?.output || []) {
    for (const contentItem of outputItem?.content || []) {
      if (typeof contentItem?.text === 'string' && contentItem.text.trim()) {
        return contentItem.text
      }

      if (typeof contentItem?.json === 'object' && contentItem.json !== null) {
        return JSON.stringify(contentItem.json)
      }
    }
  }

  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  if (!process.env.OPENAI_API_KEY) {
    return sendJson(res, 500, {
      error: 'Missing OPENAI_API_KEY environment variable.'
    })
  }

  try {
    const { image, images, meal, context } = req.body || {}

    // Support both single image (legacy) and images array
    const imageList = Array.isArray(images) && images.length > 0
      ? images
      : image && typeof image === 'string' ? [image] : []

    const hasImages = imageList.length > 0
    const hasContext = context && typeof context === 'string' && context.trim()
    const isMulti = imageList.length > 1

    if (!hasImages && !hasContext) {
      return sendJson(res, 400, { error: 'Provide at least one image or a text description of the food.' })
    }

    const systemText = hasImages
      ? isMulti
        ? 'You analyze nutrition labels and food photos. The user sends multiple images — each is a separate ingredient or food item. For nutrition label photos, read the exact values printed on the label (use per-serving amounts). For food photos, estimate the nutrition. Return one item in the items array per image, in the same order as the images. Always set isFoodPhoto to true when any image is food or a nutrition label.'
        : 'You analyze food photos and text descriptions. Return JSON only. First decide whether the image is actually food. If it is not food, set isFoodPhoto to false and return an empty items array. If it is food or a nutrition label, identify each item and estimate nutrition per item. Include sodium in milligrams. Be conservative and realistic when uncertain.'
      : 'You are a nutrition estimator. The user will describe foods in text. Return JSON only. Always set isFoodPhoto to true. Identify each food item mentioned, estimate realistic portion sizes, and provide accurate nutrition estimates. Include sodium and sugar. Be conservative and realistic.'

    const imageBlocks = imageList.map((img) => ({
      type: 'input_image',
      image_url: img,
      detail: 'high'
    }))

    const extraItemsText = context
      ? ` The user also wrote: "${context.trim()}". Use this to clarify portion sizes or names for the photos if it matches them. If it mentions foods NOT already covered by the photos, add those as additional items. Do NOT add duplicate items for foods already identified from the photos.`
      : ''

    const userContent = hasImages
      ? [
          {
            type: 'input_text',
            text: isMulti
              ? `I'm logging a ${meal || 'meal'}. I have ${imageList.length} ingredient photos — return one item per photo in order, reading exact values from nutrition labels when visible.${extraItemsText} Return protein/carbs/fat/sugar in grams, sodium in milligrams.`
              : `Analyze this ${meal || 'meal'} photo and return each visible food as a separate item.${extraItemsText} Return protein/carbs/fat/sugar in grams, sodium in milligrams.`
          },
          ...imageBlocks
        ]
      : [
          {
            type: 'input_text',
            text: `Estimate nutrition for this ${meal || 'meal'}: "${context.trim()}". Return each food as a separate item. Return protein/carbs/fat/sugar in grams and sodium in milligrams.`
          }
        ]

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: systemText }]
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'foodAnalysis',
            strict: true,
            schema: FOOD_ANALYSIS_SCHEMA
          }
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return sendJson(res, response.status, {
        error: 'OpenAI request failed',
        details: errorText
      })
    }

    const data = await response.json()
    const outputText = extractStructuredOutput(data)

    if (!outputText) {
      return sendJson(res, 502, {
        error: 'No structured output returned.',
        details: JSON.stringify(data).slice(0, 2000)
      })
    }

    const parsed = JSON.parse(outputText)
    return sendJson(res, 200, parsed)
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to analyze food photo.',
      details: error.message
    })
  }
}
