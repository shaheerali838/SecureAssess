import { DepartmentService } from "./department.service.js";
import { DepartmentValidator } from "./department.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const createDepartment = asyncHandler(async (req, res) => {
  const { isValid, errors } = DepartmentValidator.validateCreate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = req.params.organizationId;
  const department = await DepartmentService.createDepartment(organizationId, req.body);
  return res.status(201).json(new ApiResponse(201, department, "Department created successfully"));
});

export const getDepartments = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  const result = await DepartmentService.getDepartments(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Departments retrieved successfully"));
});

export const getDepartment = asyncHandler(async (req, res) => {
  const { organizationId, departmentId } = req.params;
  const department = await DepartmentService.getDepartment(organizationId, departmentId);
  return res.status(200).json(new ApiResponse(200, department, "Department retrieved successfully"));
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const { isValid, errors } = DepartmentValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, departmentId } = req.params;
  const department = await DepartmentService.updateDepartment(organizationId, departmentId, req.body);
  return res.status(200).json(new ApiResponse(200, department, "Department updated successfully"));
});

export const updateDepartmentStatus = asyncHandler(async (req, res) => {
  const { isValid, errors } = DepartmentValidator.validateStatusUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, departmentId } = req.params;
  const department = await DepartmentService.updateDepartmentStatus(
    organizationId,
    departmentId,
    req.body.status
  );
  return res.status(200).json(new ApiResponse(200, department, `Department status updated to '${req.body.status}'`));
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const { organizationId, departmentId } = req.params;
  const result = await DepartmentService.deleteDepartment(organizationId, departmentId);
  return res.status(200).json(new ApiResponse(200, result, "Department archived successfully"));
});
