export type Role = 'COLLABORATOR' | 'RESPONSABLE' | 'SUPER_ADMIN'

export interface User {
  id: string
  email: string
  role: Role
  serviceId: string | null
  isActive: boolean
}

export interface Service {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface Article {
  id: string
  title: string
  content: string
  summary: string | null
  type: string | null
  serviceId: string
  service: Pick<Service, 'id' | 'name' | 'slug'>
  visibility: string
  status: 'DRAFT' | 'PUBLISHED'
  tags: string[]
  authorId: string
  author: Pick<User, 'id' | 'email'>
  createdAt: string
  updatedAt: string
}

export interface SearchResult {
  id: string
  title: string
  summary: string | null
  service: Pick<Service, 'id' | 'name' | 'slug'>
  author: Pick<User, 'id' | 'email'>
  updatedAt: string
  score: number
}

export interface ApiError {
  message: string
  statusCode: number
}
