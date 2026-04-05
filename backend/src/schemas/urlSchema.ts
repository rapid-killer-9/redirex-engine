// ── Auth ─────────────────────────────────────────────────────────────────

export const RegisterSchema = {
  description: 'Register a new user',
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email:    { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        token:  { type: 'string' },
      },
    },
  },
};

export const LoginSchema = {
  description: 'Login with email and password',
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email:    { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        token:  { type: 'string' },
      },
    },
  },
};

// ── URL Operations ────────────────────────────────────────────────────────

export const ShortenUrlSchema = {
  description: 'Shorten a URL (anonymous or authenticated). Authenticated links are tracked per-user.',
  tags: ['URL Operations'],
  body: {
    type: 'object',
    required: ['url'],
    properties: {
      url:         { type: 'string', format: 'uri' },
      title:       { type: 'string', maxLength: 255 },
      description: { type: 'string', maxLength: 1000 },
      expiresAt:   { type: 'string', format: 'date-time', description: 'ISO 8601 expiry datetime' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        shortKey: { type: 'string' },
        shortUrl: { type: 'string' },
      },
    },
  },
};

export const RedirectSchema = {
  description: 'Redirect to the original long URL',
  tags: ['URL Operations'],
  params: {
    type: 'object',
    properties: {
      shortKey: { type: 'string', description: 'Base62 short key' },
    },
  },
};

export const ListUrlsSchema = {
  description: 'List all URLs created by the authenticated user',
  tags: ['URL Management'],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page:  { type: 'integer', default: 1 },
      limit: { type: 'integer', default: 20, maximum: 100 },
    },
  },
};

export const GetUrlSchema = {
  description: 'Get a single URL with recent click data',
  tags: ['URL Management'],
  security: [{ bearerAuth: [] }],
  params: { type: 'object', properties: { shortKey: { type: 'string' } } },
};

export const UpdateUrlSchema = {
  description: 'Update URL metadata or toggle active state',
  tags: ['URL Management'],
  security: [{ bearerAuth: [] }],
  params: { type: 'object', properties: { shortKey: { type: 'string' } } },
  body: {
    type: 'object',
    properties: {
      isActive:    { type: 'boolean' },
      title:       { type: 'string', maxLength: 255 },
      description: { type: 'string', maxLength: 1000 },
      expiresAt:   { type: ['string', 'null'], format: 'date-time' },
    },
  },
};

export const DeleteUrlSchema = {
  description: 'Delete a URL permanently',
  tags: ['URL Management'],
  security: [{ bearerAuth: [] }],
  params: { type: 'object', properties: { shortKey: { type: 'string' } } },
  response: { 204: { type: 'null' } },
};

export const AnalyticsSchema = {
  description: 'Get 30-day click analytics for a URL (daily, device, country breakdown)',
  tags: ['Analytics'],
  security: [{ bearerAuth: [] }],
  params: { type: 'object', properties: { shortKey: { type: 'string' } } },
};
