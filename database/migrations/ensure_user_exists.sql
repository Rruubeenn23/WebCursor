-- Function to ensure user exists
CREATE OR REPLACE FUNCTION ensure_user_exists(user_id UUID, user_email TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (user_id, user_email)
    ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run it for your current user
SELECT ensure_user_exists('4323a73e-5e2e-4ddb-ab54-19d11d5ae19e', 'rubencereceda23@gmail.com');
