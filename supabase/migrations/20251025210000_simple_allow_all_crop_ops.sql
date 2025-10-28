-- Simple fix: Allow all operations on crop_coefficients
DROP POLICY IF EXISTS "Allow all crop operations" ON crop_coefficients;
CREATE POLICY "Allow all crop operations" ON crop_coefficients FOR ALL USING (true);