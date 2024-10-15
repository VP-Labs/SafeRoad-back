const { Schema, model, SchemaType } = require("mongoose");




// answers collection
const answerSchema = new Schema(
  {
    question: {
      type : Schema.Types.ObjectId,
      ref : "Question"
    },
    numero: {
      type: Number,
      required: [true, "Numero is required."],
      unique: true,
    },
    answers: {
      type: [String],
      required: [true, "answers are required."],
    },
    commentaire: {
      type: String,
      required: [true, "commentaire is required."],
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Answer = model("Answer", answerSchema);






module.exports = Answer;
