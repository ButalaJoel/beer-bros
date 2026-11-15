export type AuthUser = { id: string; email: string; handle: string; display_name: string }

declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

export {}
