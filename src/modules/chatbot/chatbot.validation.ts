import { z } from 'zod';

export const chatbotIdParamsSchema = z.object({
  chatbotId: z.uuid('Invalid chatbot id'),
});

export const conversationIdParamsSchema = z.object({
  chatbotId: z.uuid('Invalid chatbot id'),
  conversationId: z.uuid('Invalid conversation id'),
});

export const sourceIdParamsSchema = z.object({
  chatbotId: z.uuid('Invalid chatbot id'),
  sourceId: z.uuid('Invalid source id'),
});

export const domainIdParamsSchema = z.object({
  chatbotId: z.uuid('Invalid chatbot id'),
  domainId: z.uuid('Invalid domain id'),
});

export const createChatbotSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  model: z.string().max(255).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topK: z.int().min(1).max(20).optional(),
  chunkSize: z.int().min(200).max(4000).optional(),
  chunkOverlap: z.int().min(0).max(1000).optional(),
  maxContextItems: z.int().min(1).max(20).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

export const updateChatbotSchema = createChatbotSchema.partial();

export const addDomainSchema = z.object({
  domain: z.string().min(3).max(255),
});

export const createSourceSchema = z
  .object({
    type: z.enum(['TEXT', 'DOCUMENT', 'URL']),
    title: z.string().min(1).max(255),
    textBody: z.string().optional(),
    url: z.url('Invalid URL').optional(),
    mimeType: z.string().optional(),
    fileName: z.string().optional(),
    base64Content: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'TEXT' && !value.textBody) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['textBody'],
        message: 'textBody is required for TEXT source',
      });
    }

    if (value.type === 'URL' && !value.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'url is required for URL source',
      });
    }

    if (value.type === 'DOCUMENT' && !value.base64Content) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['base64Content'],
        message: 'base64Content is required for DOCUMENT source',
      });
    }
  });

export const publicChatSchema = z
  .object({
    publicKey: z.string().min(8).max(255).optional(),
    chatbotId: z.string().min(8).max(255).optional(), // Changed from z.uuid() to string to allow publicKey as chatbotId
    message: z.string().min(1).max(8000),
    conversationId: z.uuid('Invalid conversation id').optional(),
    origin: z.string().optional(),
    visitorId: z.string().max(255).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.publicKey && !value.chatbotId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['publicKey'],
        message: 'Either publicKey or chatbotId is required',
      });
    }
  });

export type CreateChatbotInput = z.infer<typeof createChatbotSchema>;
export type UpdateChatbotInput = z.infer<typeof updateChatbotSchema>;
export type AddDomainInput = z.infer<typeof addDomainSchema>;
export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type PublicChatInput = z.infer<typeof publicChatSchema>;
