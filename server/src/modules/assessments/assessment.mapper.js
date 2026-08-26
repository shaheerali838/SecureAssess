export class AssessmentMapper {
  /**
   * Transforms Assessment database model into safe API response DTO
   */
  static toDTO(assessment) {
    if (!assessment) return null;
    const doc = typeof assessment.toObject === "function" ? assessment.toObject() : assessment;

    return {
      id: doc._id,
      organizationId: doc.organizationId,
      title: doc.title,
      description: doc.description,
      type: doc.type,
      status: doc.status,
      durationMinutes: doc.durationMinutes,
      passingPercentage: doc.passingPercentage,
      accessCode: doc.accessCode,
      proctoringSettings: doc.proctoringSettings,
      scheduledStart: doc.scheduledStart,
      scheduledEnd: doc.scheduledEnd,
      createdBy: doc.createdBy
        ? {
            id: doc.createdBy._id || doc.createdBy,
            name: doc.createdBy.name,
            email: doc.createdBy.email,
          }
        : null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static toDTOList(assessments) {
    if (!Array.isArray(assessments)) return [];
    return assessments.map((a) => this.toDTO(a));
  }
}
