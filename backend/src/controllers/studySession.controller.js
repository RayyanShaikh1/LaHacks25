import { processStudyMaterials } from "../lib/gemini.js";
import Group from "../models/group.model.js";
import User from "../models/user.model.js";

export const processStudyFile = async (req, res) => {
  try {
    const { groupId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Get the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Get group member names for context
    const members = await User.find({
      _id: { $in: group.members },
    }).select("name");
    const memberNames = members.map((m) => m.name);

    // Create or get AI agent ID for this group's study session
    if (!group.studyAgentId) {
      group.studyAgentId = `study_${group._id}`;
      await group.save();
    }

    // Process all files and combine their content
    let combinedLessonPlan = null;
    for (const file of files) {
      const lessonPlan = await processStudyMaterials(
        file,
        group.studyAgentId,
        memberNames
      );
      
      if (!combinedLessonPlan) {
        combinedLessonPlan = lessonPlan;
      } else {
        // Merge the lesson plans by combining modules and their lessons
        const existingModules = new Map();
        
        // First, create a map of existing modules
        combinedLessonPlan.modules.forEach(module => {
          existingModules.set(module.module, module);
        });
        
        // Then, merge new modules and their lessons
        lessonPlan.modules.forEach(newModule => {
          if (existingModules.has(newModule.module)) {
            // If module exists, merge lessons
            const existingModule = existingModules.get(newModule.module);
            existingModule.lessons = [...new Set([...existingModule.lessons, ...newModule.lessons])];
          } else {
            // If module doesn't exist, add it
            combinedLessonPlan.modules.push(newModule);
          }
        });
      }
    }

    // Save the combined lesson plan to the group
    group.studySessionLesson = combinedLessonPlan;
    await group.save();

    res.status(200).json({ lessonPlan: combinedLessonPlan });
  } catch (error) {
    console.error("Error in processStudyFile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// New: Get the current lesson plan for a group
export const getStudySessionLesson = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.status(200).json({ lessonPlan: group.studySessionLesson });
  } catch (error) {
    console.error("Error in getStudySessionLesson:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 