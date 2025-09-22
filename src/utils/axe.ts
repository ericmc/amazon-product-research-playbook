import axe from '@axe-core/react';
import React from 'react';
import ReactDOM from 'react-dom';

if (import.meta.env.DEV) {
  // Initialize axe for development with default configuration
  axe(React, ReactDOM, 1000);
}