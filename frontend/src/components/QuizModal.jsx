import { useState, useEffect } from "react";
import { X, ChevronRight, Check, XCircle } from "lucide-react";
import { axiosInstance } from "../lib/axios";

const QuizModal = ({ quiz, onClose, groupId, topic, initialAnswers, onQuizCompleted }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(initialAnswers || []);
  const [showResults, setShowResults] = useState(!!initialAnswers);
  const [score, setScore] = useState(0);
  const isReviewMode = Array.isArray(initialAnswers);

  const currentQuestion = quiz.questions[currentQuestionIndex];

  useEffect(() => {
    if (showResults && groupId && topic && !isReviewMode) {
      // Send the student's answers to the backend
      axiosInstance.post(`/study-session/chat/${groupId}/${encodeURIComponent(topic)}/quiz-response`, {
        answers: selectedAnswers
      }).then(() => {
        if (onQuizCompleted) onQuizCompleted(selectedAnswers);
      }).catch((err) => {
        console.error("Failed to save quiz results", err);
      });
    }
  }, [showResults, groupId, topic, selectedAnswers, isReviewMode, onQuizCompleted]);

  useEffect(() => {
    if (isReviewMode) {
      // Calculate score for review mode
      const correctAnswers = quiz.questions.reduce((acc, question, index) => {
        return acc + (initialAnswers[index] === question.correct ? 1 : 0);
      }, 0);
      setScore(correctAnswers);
      setShowResults(true);
    }
  }, [isReviewMode, initialAnswers, quiz.questions]);

  const handleAnswerSelect = (optionIndex) => {
    if (isReviewMode) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      const correctAnswers = quiz.questions.reduce((acc, question, index) => {
        return acc + (selectedAnswers[index] === question.correct ? 1 : 0);
      }, 0);
      setScore(correctAnswers);
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers([]);
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  if (!quiz) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 rounded-lg w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-200">
            {isReviewMode ? "Quiz Review" : "Quiz"}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showResults ? (
            <>
              {/* Progress bar */}
              <div className="w-full bg-neutral-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <div className="mb-4">
                <p className="text-neutral-300">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </p>
                <p className="text-neutral-200 mt-2">{currentQuestion.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      selectedAnswers[currentQuestionIndex] === index
                        ? "bg-blue-600 text-white"
                        : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
                    }`}
                    disabled={isReviewMode}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {/* Next button */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 rounded-lg bg-neutral-700 text-neutral-200 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                >
                  {currentQuestionIndex === quiz.questions.length - 1
                    ? "Submit"
                    : "Next"}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* Results header */}
              <div className="text-center">
                <h4 className="text-2xl font-semibold text-neutral-200 mb-2">
                  Quiz Complete!
                </h4>
                <p className="text-neutral-400">
                  You scored {score} out of {quiz.questions.length}
                </p>
              </div>

              {/* Questions and answers */}
              <div className="space-y-6">
                {quiz.questions.map((question, index) => (
                  <div key={index} className="space-y-3">
                    <p className="text-neutral-200 font-medium">{question.question}</p>
                    <div className="flex items-center gap-2">
                      {selectedAnswers[index] === question.correct ? (
                        <Check className="text-green-500" size={20} />
                      ) : (
                        <XCircle className="text-red-500" size={20} />
                      )}
                      <p className="text-neutral-400">
                        Your answer: {question.options[selectedAnswers[index]]}
                      </p>
                    </div>
                    <p className="text-neutral-400 text-sm">
                      {question.explanation}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                {!isReviewMode && (
                  <button
                    onClick={handleRetake}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                  >
                    Retake Quiz
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizModal; 