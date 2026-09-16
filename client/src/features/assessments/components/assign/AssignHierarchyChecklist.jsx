import React from "react";
import { CheckCircle2, CheckSquare, Square } from "lucide-react";

export function AssignHierarchyChecklist({
  assignmentScope,
  filteredDepartments,
  selectedDepartmentIds,
  setSelectedDepartmentIds,
  filteredPrograms,
  selectedProgramIds,
  setSelectedProgramIds,
  filteredSubjects,
  selectedSubjectIds,
  setSelectedSubjectIds,
  filteredGroups,
  selectedGroupIds,
  setSelectedGroupIds,
  toggleItem,
}) {
  let items = [];
  let selectedIds = [];
  let setFunc = () => {};
  let title = "";

  if (assignmentScope === "departments") {
    items = filteredDepartments;
    selectedIds = selectedDepartmentIds;
    setFunc = setSelectedDepartmentIds;
    title = "Academic Departments & Divisions";
  } else if (assignmentScope === "programs") {
    items = filteredPrograms;
    selectedIds = selectedProgramIds;
    setFunc = setSelectedProgramIds;
    title = "Degree Programs & Majors";
  } else if (assignmentScope === "subjects") {
    items = filteredSubjects;
    selectedIds = selectedSubjectIds;
    setFunc = setSelectedSubjectIds;
    title = "Subjects / Courses";
  } else if (assignmentScope === "groups") {
    items = filteredGroups;
    selectedIds = selectedGroupIds;
    setFunc = setSelectedGroupIds;
    title = "Candidate Cohort Groups";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-accent-700 dark:text-accent-300">
          Target {title}:
        </p>
        <span className="text-[11px] text-accent-500">
          {selectedIds.length} selected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="col-span-2 text-center py-6 text-xs text-accent-500">
            No items found.
          </div>
        ) : (
          items.map((item) => {
            const id = item._id || item.id;
            const isSelected = selectedIds.includes(id);

            return (
              <div
                key={id}
                onClick={() => toggleItem(selectedIds, setFunc, id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all text-xs flex items-center justify-between ${
                  isSelected
                    ? "bg-primary-50 dark:bg-primary-950/30 border-primary-500 text-primary-900 dark:text-primary-100 ring-1 ring-primary-500"
                    : "bg-white dark:bg-accent-850 border-accent-200 dark:border-accent-700 hover:bg-accent-100/50 dark:hover:bg-accent-800"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isSelected ? (
                    <CheckSquare size={15} className="text-primary-600 shrink-0" />
                  ) : (
                    <Square size={15} className="text-accent-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-accent-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-accent-500 font-mono truncate">
                      {item.code || item.description || "COHORT"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
