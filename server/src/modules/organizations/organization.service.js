import { OrganizationRepository } from "./organization.repository.js";
import { OrganizationMapper } from "./organization.mapper.js";
import { ORGANIZATION_MESSAGES, ORGANIZATION_STATUS } from "./organization.constants.js";
import { ApiError } from "../../utils/ApiError.js";

export class OrganizationService {
  static async createOrganization(data) {
    const existingSlug = await OrganizationRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw new ApiError(400, ORGANIZATION_MESSAGES.SLUG_EXISTS);
    }

    if (data.domain) {
      const existingDomain = await OrganizationRepository.findByDomain(data.domain);
      if (existingDomain) {
        throw new ApiError(400, "An organization with this domain already exists");
      }
    }

    const created = await OrganizationRepository.create(data);
    return OrganizationMapper.toDTO(created);
  }

  static async getOrganizationById(id) {
    const org = await OrganizationRepository.findById(id);
    if (!org) {
      throw new ApiError(404, ORGANIZATION_MESSAGES.NOT_FOUND);
    }
    return OrganizationMapper.toDTO(org);
  }

  static async getOrganizationBySlug(slug) {
    const org = await OrganizationRepository.findBySlug(slug);
    if (!org) {
      throw new ApiError(404, ORGANIZATION_MESSAGES.NOT_FOUND);
    }
    return OrganizationMapper.toPublicProfileDTO(org);
  }

  static async listOrganizations(filter = {}, pagination = { skip: 0, limit: 10 }) {
    const { items, total } = await OrganizationRepository.findAll(filter, pagination);
    return {
      items: OrganizationMapper.toDTOList(items),
      total,
    };
  }

  static async updateOrganization(id, updateData) {
    // Prevent changing slug directly without admin migration
    delete updateData.slug;

    const updated = await OrganizationRepository.update(id, updateData);
    if (!updated) {
      throw new ApiError(404, ORGANIZATION_MESSAGES.NOT_FOUND);
    }
    return OrganizationMapper.toDTO(updated);
  }

  static async updateSubscription(id, subscriptionData) {
    const updated = await OrganizationRepository.update(id, {
      subscription: subscriptionData,
    });
    if (!updated) {
      throw new ApiError(404, ORGANIZATION_MESSAGES.NOT_FOUND);
    }
    return OrganizationMapper.toDTO(updated);
  }

  static async deactivateOrganization(id) {
    const updated = await OrganizationRepository.update(id, {
      status: ORGANIZATION_STATUS.DEACTIVATED,
      isActive: false,
    });
    if (!updated) {
      throw new ApiError(404, ORGANIZATION_MESSAGES.NOT_FOUND);
    }
    return { success: true, message: ORGANIZATION_MESSAGES.DEACTIVATED };
  }
}
