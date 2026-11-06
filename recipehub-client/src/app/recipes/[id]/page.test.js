import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeDetails from './page';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn()
}));

jest.mock('@/context/AppContext', () => ({
  useApp: jest.fn()
}));

const mockPush = jest.fn();
const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test-user@example.test'
};
const mockRecipe = {
  _id: 'recipe-123',
  recipeName: 'Test Recipe',
  recipeImage: 'https://example.test/recipe.jpg',
  category: 'Dinner',
  cuisineType: 'Test',
  difficultyLevel: 'Easy',
  preparationTime: 25,
  ingredients: ['Rice'],
  instructions: 'Cook the rice.',
  authorName: 'Recipe Author',
  authorEmail: 'author@example.test',
  likesCount: 0,
  isLocked: false
};

let reviewResponse;
let fetchWithAuth;

const jsonResponse = (body, ok = true) => ({
  ok,
  json: async () => body
});

function mockApi() {
  fetchWithAuth = jest.fn(async (url, options = {}) => {
    if (url.endsWith('/api/recipes/recipe-123/reviews')) {
      if (options.method === 'PUT') {
        reviewResponse = {
          success: true,
          reviews: [{
            userName: 'Test User',
            rating: 3,
            comment: 'Made it again and liked it.',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            isOwnReview: true
          }],
          averageRating: 3,
          reviewCount: 1
        };
        return jsonResponse({ success: true, message: 'Review saved successfully' });
      }
      return jsonResponse(reviewResponse);
    }

    if (url.endsWith('/api/recipes/recipe-123')) {
      return jsonResponse({ success: true, data: mockRecipe });
    }
    if (url.endsWith('/api/payments/purchased')) {
      return jsonResponse({ success: true, data: [] });
    }
    return jsonResponse({ success: false, message: 'Unexpected test request' }, false);
  });
}

function renderRecipe(user = null) {
  useParams.mockReturnValue({ id: 'recipe-123' });
  useRouter.mockReturnValue({ push: mockPush });
  useApp.mockReturnValue({
    user,
    fetchWithAuth,
    favorites: [],
    fetchFavorites: jest.fn()
  });
  return render(<RecipeDetails />);
}

beforeEach(() => {
  jest.clearAllMocks();
  reviewResponse = { success: true, reviews: [], averageRating: 0, reviewCount: 0 };
  mockApi();
});

test('renders recipe details and public review summary/reviews', async () => {
  reviewResponse = {
    success: true,
    reviews: [{
      userName: 'Public Reviewer',
      rating: 4,
      comment: 'Easy to follow and delicious.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isOwnReview: false
    }],
    averageRating: 4,
    reviewCount: 1
  };

  renderRecipe();

  expect(await screen.findByRole('heading', { name: 'Test Recipe' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Ratings & Reviews' })).toBeInTheDocument();
  expect(screen.getByText(/4 out of 5.*1 review/)).toBeInTheDocument();
  expect(screen.getByText('Public Reviewer')).toBeInTheDocument();
  expect(screen.getByText('Easy to follow and delicious.')).toBeInTheDocument();
});

test('prompts signed-out users to sign in before reviewing', async () => {
  const user = userEvent.setup();
  renderRecipe();

  await user.click(await screen.findByRole('button', { name: 'Sign in' }));
  expect(mockPush).toHaveBeenCalledWith('/login');
  expect(screen.queryByLabelText('Your review')).not.toBeInTheDocument();
});

test('allows an authenticated user to select stars and submit a review', async () => {
  const user = userEvent.setup();
  renderRecipe(mockUser);

  const threeStars = await screen.findByRole('radio', { name: '3 stars' });
  await user.click(threeStars);
  expect(threeStars).toHaveAttribute('aria-checked', 'true');

  await user.type(screen.getByRole('textbox', { name: /Your review/ }), 'Made it again and liked it.');
  await user.click(screen.getByRole('button', { name: 'Submit review' }));

  await waitFor(() => expect(screen.getByText('Your review has been saved.')).toBeInTheDocument());
  expect(fetchWithAuth).toHaveBeenCalledWith(
    expect.stringMatching(/\/api\/recipes\/recipe-123\/reviews$/),
    expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ rating: 3, comment: 'Made it again and liked it.' })
    })
  );
  expect(await screen.findByRole('button', { name: 'Update review' })).toBeInTheDocument();
});

test('shows a disabled saving state while review submission is pending', async () => {
  const user = userEvent.setup();
  const normalFetch = fetchWithAuth;
  let resolveSubmission;
  fetchWithAuth = jest.fn((url, options = {}) => {
    if (url.endsWith('/api/recipes/recipe-123/reviews') && options.method === 'PUT') {
      return new Promise(resolve => {
        resolveSubmission = resolve;
      });
    }
    return normalFetch(url, options);
  });

  renderRecipe(mockUser);
  await screen.findByRole('button', { name: 'Submit review' });
  await user.type(screen.getByRole('textbox', { name: /Your review/ }), 'A pending review');
  await user.click(screen.getByRole('button', { name: 'Submit review' }));

  const savingButton = screen.getByRole('button', { name: 'Saving...' });
  expect(savingButton).toBeDisabled();

  resolveSubmission(jsonResponse({ success: true, message: 'Review saved successfully' }));
  expect(await screen.findByText('Your review has been saved.')).toBeInTheDocument();
});

test('shows server validation errors without losing the form', async () => {
  const user = userEvent.setup();
  renderRecipe(mockUser);
  await screen.findByRole('button', { name: 'Submit review' });

  fetchWithAuth.mockImplementation(async (url, options = {}) => {
    if (url.endsWith('/api/recipes/recipe-123/reviews') && options.method === 'PUT') {
      return jsonResponse({ success: false, message: 'Rating must be a whole number from 1 to 5' }, false);
    }
    if (url.endsWith('/api/recipes/recipe-123/reviews')) return jsonResponse(reviewResponse);
    if (url.endsWith('/api/recipes/recipe-123')) return jsonResponse({ success: true, data: mockRecipe });
    if (url.endsWith('/api/payments/purchased')) return jsonResponse({ success: true, data: [] });
    return jsonResponse({ success: false }, false);
  });

  await user.type(screen.getByRole('textbox', { name: /Your review/ }), 'A review with invalid rating state');
  await user.click(screen.getByRole('button', { name: 'Submit review' }));

  expect(await screen.findByRole('status')).toHaveTextContent('Rating must be a whole number from 1 to 5');
  expect(screen.getByRole('textbox', { name: /Your review/ })).toBeInTheDocument();
});
