// src/pages/Poll/CreatePollPage.jsx
import React, { useState } from "react";
import Button from "../../components/common/Button/Button";
import { createPoll } from "../../api/groups";
import './CreatePollPage.css';

const CreatePollPage = ({ group, onBack }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // const currentUser = 'Alice'; // Replace with actual logged-in user
  const currentUser = localStorage.getItem('username') || "Guest";
  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!question.trim()) {
      setError('Please enter a poll question');
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const pollData = {
        question: question.trim(),
        options: validOptions,
        createdBy: currentUser
      };

      await createPoll(group.id, pollData);
      alert("Poll created successfully!");
      onBack();
    } catch (err) {
      console.error('Error creating poll:', err);
      setError(err.response?.data?.error || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-poll-container">
      <h2>Create Poll for {group.name}</h2>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="form-group">
        <label>Poll Question *</label>
        <input
          type="text"
          placeholder="Enter poll question"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="options-section">
        <label>Options *</label>
        {options.map((opt, i) => (
          <div key={i} className="option-input-group">
            <input
              type="text"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={e => handleOptionChange(i, e.target.value)}
              className="form-input"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemoveOption(i)}
                className="remove-option-btn"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="create-poll-actions">
        <Button 
          variant="secondary"
          onClick={handleAddOption}
          disabled={loading}
        >
          + Add Option
        </Button>
        <Button 
          variant="success" 
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Poll'}
        </Button>
        <Button 
          variant="secondary" 
          onClick={onBack}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default CreatePollPage;