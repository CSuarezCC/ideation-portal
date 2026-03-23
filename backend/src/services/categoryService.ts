import { ulid } from 'ulid'
import type { Category } from '../shared/types/index.js'
import { categoryRepository } from '../repositories/categoryRepository.js'

export const categoryService = {
  async create(name: string, description: string | undefined, createdBy: string): Promise<Category> {
    const now = new Date().toISOString()
    const category: Category = {
      categoryId: ulid(), name, description: description || undefined,
      isActive: 'true', createdBy, createdAt: now, updatedAt: now,
    }
    await categoryRepository.create(category)
    return category
  },

  async isNameTaken(name: string, excludeCategoryId?: string): Promise<boolean> {
    const existing = await categoryRepository.findActiveByName(name)
    return existing !== null && existing.categoryId !== excludeCategoryId
  },

  async update(categoryId: string, fields: { name?: string; description?: string }) {
    await categoryRepository.update(categoryId, fields)
  },

  async toggleActive(categoryId: string, currentIsActive: string) {
    const newActive = currentIsActive === 'true' ? 'false' : 'true'
    await categoryRepository.toggleActive(categoryId, newActive)
    return newActive
  },
}
