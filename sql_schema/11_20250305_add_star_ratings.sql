-- Add star rating columns to razor_reviews table
ALTER TABLE razor_reviews 
ADD COLUMN IF NOT EXISTS efficiency_gentleness_ratio INTEGER CHECK (efficiency_gentleness_ratio >= 1 AND efficiency_gentleness_ratio <= 5),
ADD COLUMN IF NOT EXISTS lather_evacuation INTEGER CHECK (lather_evacuation >= 1 AND lather_evacuation <= 5),
ADD COLUMN IF NOT EXISTS handle_grip INTEGER CHECK (handle_grip >= 1 AND handle_grip <= 5),
ADD COLUMN IF NOT EXISTS overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5);

-- Ensure RLS is enabled
ALTER TABLE razor_reviews ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it exists
DROP POLICY IF EXISTS "Users can update their own ratings" ON razor_reviews;

-- Create the policy
CREATE POLICY "Users can update their own ratings"
ON razor_reviews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to calculate average star ratings for razors
CREATE OR REPLACE FUNCTION calculate_razor_average_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called when reviews are added, updated, or deleted
  -- We could add aggregate columns to the razors table if needed in the future
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
