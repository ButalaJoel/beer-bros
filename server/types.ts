export type AuthUser = { id: string; email: string; handle: string; display_name: string; is_admin: boolean }

declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

export {}
