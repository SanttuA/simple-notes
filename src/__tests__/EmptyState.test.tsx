import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { EmptyState } from '@/components/EmptyState';

describe('EmptyState', () => {
  it('renders empty state copy', () => {
    render(<EmptyState icon="search-outline" title="No matches" body="Try another search." />);

    expect(screen.getByText('No matches')).toBeTruthy();
    expect(screen.getByText('Try another search.')).toBeTruthy();
  });
});
