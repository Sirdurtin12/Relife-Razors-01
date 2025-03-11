-- Create a new table for razor reviews with rich content
CREATE TABLE IF NOT EXISTS razor_reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razor_id BIGINT NOT NULL REFERENCES razors(id) ON DELETE CASCADE,
  gentleness_rating INTEGER NOT NULL CHECK (gentleness_rating >= 1 AND gentleness_rating <= 20),
  review_content TEXT, -- HTML content of the review
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, razor_id) -- One review per user per razor
);

-- Create a table for review likes
CREATE TABLE IF NOT EXISTS review_likes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id BIGINT NOT NULL REFERENCES razor_reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, review_id) -- One like per user per review
);

-- Create a function to increment the likes count when a like is added
CREATE OR REPLACE FUNCTION increment_review_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE razor_reviews
  SET likes_count = likes_count + 1
  WHERE id = NEW.review_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to decrement the likes count when a like is removed
CREATE OR REPLACE FUNCTION decrement_review_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE razor_reviews
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = OLD.review_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update the likes count
CREATE TRIGGER after_review_like_insert
AFTER INSERT ON review_likes
FOR EACH ROW
EXECUTE FUNCTION increment_review_likes();

CREATE TRIGGER after_review_like_delete
AFTER DELETE ON review_likes
FOR EACH ROW
EXECUTE FUNCTION decrement_review_likes();

-- Create a function to get reviews with profiles and likes information
CREATE OR REPLACE FUNCTION get_reviews_with_profiles_and_likes(
  razor_id_param BIGINT,
  current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  razor_id BIGINT,
  gentleness_rating INTEGER,
  review_content TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  user_has_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    r.razor_id,
    r.gentleness_rating,
    r.review_content,
    r.likes_count,
    (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id)::INTEGER AS comments_count,
    r.created_at,
    r.updated_at,
    p.username,
    p.full_name,
    p.avatar_url,
    CASE
      WHEN current_user_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1
        FROM review_likes rl
        WHERE rl.review_id = r.id AND rl.user_id = current_user_id
      )
    END AS user_has_liked
  FROM
    razor_reviews r
  LEFT JOIN
    profiles p ON r.user_id = p.id
  WHERE
    r.razor_id = razor_id_param
  ORDER BY
    r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Set up RLS (Row Level Security) permissions
ALTER TABLE razor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

-- Policies for razor_reviews
CREATE POLICY "Anyone can read reviews" 
ON razor_reviews FOR SELECT 
USING (TRUE);

CREATE POLICY "Users can create their own reviews" 
ON razor_reviews FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON razor_reviews FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON razor_reviews FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Policies for review_likes
CREATE POLICY "Anyone can read likes" 
ON review_likes FOR SELECT 
USING (TRUE);

CREATE POLICY "Users can create their own likes" 
ON review_likes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON review_likes FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Add comment to explain this migration
COMMENT ON TABLE razor_reviews IS 'Stores rich text reviews for razors with gentleness ratings';
COMMENT ON TABLE review_likes IS 'Stores likes on razor reviews';

-- Create a table for review comments
CREATE TABLE IF NOT EXISTS review_comments (
  id BIGSERIAL PRIMARY KEY,
  review_id BIGINT NOT NULL REFERENCES razor_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id BIGINT REFERENCES review_comments(id) ON DELETE CASCADE,
  comment_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add triggers for updated_at timestamp
CREATE TRIGGER set_review_comments_updated_at
BEFORE UPDATE ON review_comments
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Set up RLS for comments
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Policies for review_comments
CREATE POLICY "Anyone can read comments" 
ON review_comments FOR SELECT 
USING (TRUE);

CREATE POLICY "Users can create their own comments" 
ON review_comments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON review_comments FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON review_comments FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create a function to get comments with user profiles
CREATE OR REPLACE FUNCTION get_review_comments(
  review_id_param BIGINT,
  current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  review_id BIGINT,
  user_id UUID,
  parent_comment_id BIGINT,
  comment_content TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_review_author BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.review_id,
    c.user_id,
    c.parent_comment_id,
    c.comment_content,
    c.created_at,
    c.updated_at,
    p.username,
    p.full_name,
    p.avatar_url,
    c.user_id = (SELECT user_id FROM razor_reviews WHERE id = c.review_id) AS is_review_author
  FROM
    review_comments c
  LEFT JOIN
    profiles p ON c.user_id = p.id
  WHERE
    c.review_id = review_id_param
  ORDER BY
    COALESCE(c.parent_comment_id, c.id),
    c.created_at;
END;
$$ LANGUAGE plpgsql;

-- Add comment to explain the new table
COMMENT ON TABLE review_comments IS 'Stores comments on razor reviews, supporting nested replies';
