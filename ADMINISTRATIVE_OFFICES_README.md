# Administrative Offices Feature

This document describes the new administrative offices feature that visualizes service coverage areas for administrative centers in Đà Nẵng.

## Overview

The administrative offices feature implements the requirements from the MVP PRD to display three layers of administrative service points with their coverage areas:

- **Layer A**: 22 administrative service offices (17 old QN districts + 5 DN quận) - 7km radius
- **Layer B**: 93 centers of new xã/phường - 5km radius  
- **Layer C**: All former xã/phường (excluding those in A/B) - 5km radius

## Components

### 1. Data Layer (`src/data/administrative-offices.ts`)

This file processes the raw data from:
- `old-district.json` (Layer A)
- `administrative-information.json` (Layer B)
- `old-commune-ward.json` (Layer C)

**Key exports:**
- `AdministrativeOffice` - TypeScript interface for office data
- `layerAOffices`, `layerBOffices`, `layerCOffices` - Processed office arrays
- `allAdministrativeOffices` - Combined array of all offices
- `layerConfigurations` - UI configuration for each layer
- `getOfficesByLayer()` - Helper function to get offices by layer
- `getLayerConfig()` - Helper function to get layer configuration

### 2. UI Components

#### `AdministrativeOffices.tsx`
Renders the administrative offices on the map with:
- **Markers**: Color-coded pins for each office
- **Circles**: Service coverage areas with configurable radius
- **Info Windows**: Detailed information popups when clicking offices

**Props:**
- `offices`: Array of administrative offices to display
- `visible`: Controls visibility of the entire layer
- `showCircles`: Controls visibility of service coverage circles
- `userLocation`: User's current location for directions
- `onOfficeClick`: Optional callback when an office is clicked

#### `AdministrativeControls.tsx`
Provides UI controls for toggling layers and features:
- **Layer toggles**: Individual controls for A, B, C layers
- **Circle toggle**: Show/hide service coverage circles
- **Quick actions**: Show all / Hide all buttons
- **Statistics**: Display count of offices in each layer

**Props:**
- `showLayerA/B/C`: Boolean states for each layer
- `showCircles`: Boolean state for circles
- `onToggleLayerA/B/C`: Callbacks for layer toggles
- `onToggleCircles`: Callback for circle toggle

### 3. Integration

#### `MainInterface.tsx`
Updated to include:
- State management for administrative layers
- Integration with `AdministrativeOffices` component
- Updated `MapControls` with new props
- Helper function `getVisibleAdministrativeOffices()`

#### `MapControls.tsx`
Enhanced with:
- New props for administrative controls
- Integration with `AdministrativeControls` component
- Updated interface definitions

## Data Structure

Each administrative office contains:

```typescript
interface AdministrativeOffice {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  address: string;
  region: string;
  procedures_2024?: number;
  procedures_6months_2025?: number;
  layer: 'A' | 'B' | 'C';
  radius: number; // in kilometers
  phone?: string;
  old_commune_ward?: string;
  is_commune?: boolean;
}
```

## Layer Configuration

Each layer has specific styling and radius:

```typescript
const layerConfigurations = {
  A: {
    radius: 7,
    color: '#DC2626', // Red
    fillColor: '#FEE2E2',
    strokeColor: '#DC2626',
  },
  B: {
    radius: 5,
    color: '#2563EB', // Blue
    fillColor: '#DBEAFE',
    strokeColor: '#2563EB',
  },
  C: {
    radius: 5,
    color: '#059669', // Green
    fillColor: '#D1FAE5',
    strokeColor: '#059669',
  },
};
```

## Features

### Service Coverage Visualization
- **Circles**: Show approximate service coverage areas
- **Transparency**: Allows overlapping areas to be visible
- **Color coding**: Different colors for each layer
- **Radius adjustment**: Configurable radius per layer

### Interactive Elements
- **Hover effects**: Highlight offices on hover
- **Click interactions**: Show detailed information
- **Directions**: Direct integration with Google Maps for navigation
- **Phone calls**: Direct calling functionality where available

### UI Controls
- **Layer toggles**: Individual control over each layer
- **Circle visibility**: Toggle service coverage circles
- **Quick actions**: Show/hide all layers at once
- **Statistics**: Display office counts per layer

### Information Display
- **Office details**: Name, address, phone, statistics
- **Service statistics**: 2024 and 6-month 2025 procedure counts
- **Regional information**: Original administrative region
- **Visual indicators**: Layer badges and color coding

## Usage

### Basic Usage
```typescript
// Show only Layer A offices with circles
const [showLayerA, setShowLayerA] = useState(true);
const [showCircles, setShowCircles] = useState(true);

<AdministrativeOffices
  offices={getOfficesByLayer('A')}
  visible={showLayerA}
  showCircles={showCircles}
  userLocation={userLocation}
/>
```

### Advanced Usage
```typescript
// Show multiple layers with selective visibility
const getVisibleOffices = () => {
  const offices = [];
  if (showLayerA) offices.push(...getOfficesByLayer('A'));
  if (showLayerB) offices.push(...getOfficesByLayer('B'));
  if (showLayerC) offices.push(...getOfficesByLayer('C'));
  return offices;
};

<AdministrativeOffices
  offices={getVisibleOffices()}
  visible={true}
  showCircles={showCircles}
  userLocation={userLocation}
  onOfficeClick={handleOfficeClick}
/>
```

## Technical Implementation

### Map Integration
- Uses `@vis.gl/react-google-maps` for map rendering
- Integrates with existing `Circle` geometry component
- Utilizes `AdvancedMarker` and `InfoWindow` for markers
- Supports responsive design for mobile and desktop

### Performance Considerations
- Efficient data processing with filtering
- Memoized calculations for visible offices
- Conditional rendering based on visibility states
- Optimized circle rendering with minimal DOM updates

### Accessibility
- Keyboard navigation support
- Screen reader compatible labels
- High contrast color schemes
- Touch-friendly mobile interface

## Future Enhancements

### Possible Improvements
1. **Dynamic radius adjustment**: Allow users to modify service radii
2. **Coverage analysis**: Highlight gaps and overlaps in service coverage
3. **Population density overlay**: Show population data within coverage areas
4. **Service quality metrics**: Display performance indicators for each office
5. **Routing optimization**: Calculate optimal service center locations
6. **Export functionality**: Save coverage analysis as PDF or image

### Data Extensions
1. **Real-time data**: Live updates of office status and wait times
2. **Service categories**: Different coverage radii for different services
3. **Historical data**: Track changes in coverage over time
4. **Citizen feedback**: Integrate user reviews and ratings

## Troubleshooting

### Common Issues
1. **Circles not showing**: Check `showCircles` prop and layer visibility
2. **Markers not clickable**: Verify `onOfficeClick` callback implementation
3. **Performance issues**: Consider limiting visible offices based on zoom level
4. **Data loading errors**: Verify JSON data structure and file paths

### Debug Tips
1. Use browser developer tools to inspect component props
2. Check console for data processing errors
3. Verify Google Maps API integration
4. Test on different devices and screen sizes

## Integration with Existing Features

The administrative offices feature is designed to work alongside existing map features:

- **Ward boundaries**: Administrative offices can be displayed with or without ward polygons
- **Existing offices**: The new feature complements the existing office markers
- **User location**: Integrates with location services for directions
- **Search functionality**: Can be extended to search within administrative offices
- **Responsive design**: Works with existing mobile-first design patterns

This feature provides a comprehensive solution for visualizing administrative service coverage in Đà Nẵng, supporting the city's urban planning and public service optimization goals.
