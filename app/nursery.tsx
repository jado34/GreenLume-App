// FIX #11: This file creates a /nursery route that mirrors /impact-map.
// The screen component is NurseryScreen (in impact-map.tsx), but the
// file was confusingly named impact-map.tsx. This alias ensures:
//  - Old /impact-map route still works (no breaking change)
//  - All new code uses /nursery which matches the UI title "Virtual Nursery"
export { default } from './impact-map';
