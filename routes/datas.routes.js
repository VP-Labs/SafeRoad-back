const express = require("express");
const router = express.Router();

const Question = require("../db/models/Question.model");
const Answer = require("../db/models/Answer.model");
const Serie = require("../db/models/Serie.model.js");
const User = require("../db/models/User.model.js");

const answerHelper = require("../helpers/answers.helper.js");

const {
  isAuthenticated,
  isolateUserId,
} = require("../middleware/jwt.middleware.js");

//GET methode for questions
router.get(
  "/questions",
  isAuthenticated,
  isolateUserId,
  async (req, res, next) => {
    // If JWT token is valid

    const nQuestions = 3;

    const randomDocs = await Question.aggregate([
      { $sample: { size: nQuestions } },
    ]);

    const questionIds = randomDocs.map(({ _id }) => _id);

    //then we create a new questions serie
    const newSerie = await (
      await Serie.create({ questions: questionIds, user: req.userId })
    ).populate("questions");

    const user = await User.findOne({ _id: req.userId });

    if (user.series.length < 10) {
      await User.updateOne(
        { _id: req.userId },
        { $push: { series: newSerie._id } }
      );
    } else {
      const [oldestSerie, ...series] = user.series;
      await Serie.deleteOne({ _id: oldestSerie });
      await User.updateOne(
        { _id: req.userId },
        { series: [...series, newSerie._id] }
      );
    }

    // Send back the token payload object containing the user data
    res.status(200).json(newSerie);
  }
);

//GET method for answers
router.get(
  "/serie/last",
  isAuthenticated,
  isolateUserId,
  async (req, res, next) => {
    // If JWT token is valid
    const serie = await Serie.findOne({
      user: req.userId,
    }).sort({createdAt: -1});
    res.status(200).json(serie);
  }
);

//POST method for answers
router.post(
  "/serie/last",
  isAuthenticated,
  isolateUserId,
  async (req, res, next) => {
    // If JWT token is valid

    const { selectedAnswers, questionId } = req.body;

    const answer = await Answer.findOne({ question: questionId });

    const answersFormatted = answerHelper.transformPropositions(answer.answers);

    const isCorrect = answerHelper.compareAnswers(
      selectedAnswers,
      answersFormatted
    );

    const latestSerie = await Serie.findOne({ user : req.userId }).sort({createdAt : -1});

    if (latestSerie.currentQuestion >= latestSerie.questions.length) {
      return res.status(401).json({message : "serie already finished"});
    }

    if (isCorrect) {
      const serie = await Serie.findOneAndUpdate(
        { _id : latestSerie._id },
        { $inc: { score: 1, currentQuestion: 1 } },
        { new: true }
      );
      res.status(200).json({nextQuestion : serie.currentQuestion});
    } else {
      const serie = await Serie.findOneAndUpdate({ _id : latestSerie._id },
        { $inc: { currentQuestion: 1 } },
        { new: true }
       );
      res.status(200).json({nextQuestion : serie.currentQuestion});
    }
  }
);

module.exports = router;
