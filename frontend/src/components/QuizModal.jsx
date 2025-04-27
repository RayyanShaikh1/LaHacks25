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
        // Optionally handle error
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

  if (!quiz) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 rounded-lg w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-200">Quiz</h3>
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
              <h4 className="text-xl font-semibold text-neutral-200 mb-6">
                {currentQuestion.question}
              </h4>

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
              <button
                onClick={handleNext}
                disabled={selectedAnswers[currentQuestionIndex] === undefined || isReviewMode}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold 
                         hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <>
                    Next Question
                    <ChevronRight size={20} />
                  </>
                ) : (
                  "Submit Quiz"
                )}
              </button>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizModal; 