// src/pages/Login/Login.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import { loginUser } from '../../api/auth';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  
  const { values, errors, loading, handleChange, handleSubmit, setErrors, setLoading } = useForm({
    username: '',
    password: ''
  });

  const onSubmit = async (formValues) => {
    try {
      const response = await loginUser(formValues.username, formValues.password);
      const data = await response;
      
      console.log('API response:', data);
      
      // Store token and username in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        
        alert('Login successful!');
        navigate('/dashboard');
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors({ submit: 'Login failed. Please try again.' });
      setLoading(false);
    }
  };

  const isFormValid = values.username.trim() !== '' && values.password.trim() !== '';

  return (
    <div className="login-container">
      <h1>Log In</h1>

      <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
        <Input
          type="text"
          name="username"
          placeholder="Username"
          value={values.username}
          onChange={handleChange}
          error={errors.username}
          required
        />
        
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          disabled={!isFormValid}
          loading={loading}
        >
          Login
        </Button>

        {errors.submit && <p className="error-message">{errors.submit}</p>}
      </form>

      <p className="signup-redirect">
        Don't have an account?{' '}
        <span onClick={() => navigate('/signup')} className="signup-link">
          Sign up
        </span>
      </p>
    </div>
  );
};

export default Login;