export const ShortenUrlSchema = {
  description: 'Create a new shortened URL',
  tags: ['URL Operations'],
  body: {
    type: 'object',
    required: ['url'],
    properties: {
      url: { 
        type: 'string', 
        format: 'uri', 
        description: 'The long URL to shorten',
        examples: ['https://google.com']
      }
    }
  },
  response: {
    200: {
      description: 'URL shortened successfully',
      type: 'object',
      properties: {
        shortKey: { type: 'string' },
        shortUrl: { type: 'string' }
      }
    }
  }
};

export const RedirectSchema = {
  description: 'Redirect to the original long URL',
  tags: ['URL Operations'],
  params: {
    type: 'object',
    properties: {
      shortKey: { type: 'string', description: 'The unique Base62 key' }
    }
  }
};
