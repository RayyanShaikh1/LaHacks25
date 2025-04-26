import { processStudyMaterials } from "../lib/gemini.js";
import Group from "../models/group.model.js";
import User from "../models/user.model.js";

export const processStudyFile = async (req, res) => {
  try {
    const { groupId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
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

    // Process the file and generate lesson plan
    const lessonPlan = await processStudyMaterials(
      file,
      group.studyAgentId,
      memberNames
    );

    res.status(200).json({ lessonPlan });
  } catch (error) {
    console.error("Error in processStudyFile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 