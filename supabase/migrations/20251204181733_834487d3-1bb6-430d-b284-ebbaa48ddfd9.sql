-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'farmer');

-- User roles table (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'farmer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Farmer profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Farms table
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location_name TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  size_acres NUMERIC,
  soil_type TEXT,
  irrigation_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Crops table (crop catalog)
CREATE TABLE public.crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  growing_season TEXT,
  water_requirement TEXT,
  days_to_harvest INTEGER,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

-- Crop history (farmer's planted crops)
CREATE TABLE public.crop_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  crop_name TEXT NOT NULL,
  planted_date DATE NOT NULL,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  area_acres NUMERIC,
  yield_kg NUMERIC,
  status TEXT DEFAULT 'growing',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crop_history ENABLE ROW LEVEL SECURITY;

-- Farm analytics/expenses
CREATE TABLE public.farm_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  crop_history_id UUID REFERENCES public.crop_history(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;

-- Farm income
CREATE TABLE public.farm_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  crop_history_id UUID REFERENCES public.crop_history(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  source TEXT,
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.farm_income ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Market prices
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL,
  market_name TEXT NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  price_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

-- Plant disease detections history
CREATE TABLE public.disease_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  plant_name TEXT,
  disease_name TEXT,
  confidence NUMERIC,
  treatment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.disease_detections ENABLE ROW LEVEL SECURITY;

-- Soil analysis history
CREATE TABLE public.soil_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  ph NUMERIC,
  nitrogen NUMERIC,
  phosphorus NUMERIC,
  potassium NUMERIC,
  moisture NUMERIC,
  soil_type TEXT,
  recommendations TEXT,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.soil_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User roles: users can read their own, admins can manage all
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: users manage own, admins can view all
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Farms: users manage own, admins can view all
CREATE POLICY "Users can manage own farms" ON public.farms FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all farms" ON public.farms FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Crops catalog: public read, admin manage
CREATE POLICY "Anyone can read crops" ON public.crops FOR SELECT USING (true);
CREATE POLICY "Admins can manage crops" ON public.crops FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Crop history: users manage own
CREATE POLICY "Users can manage own crop history" ON public.crop_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all crop history" ON public.crop_history FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Expenses: users manage own
CREATE POLICY "Users can manage own expenses" ON public.farm_expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all expenses" ON public.farm_expenses FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Income: users manage own
CREATE POLICY "Users can manage own income" ON public.farm_income FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all income" ON public.farm_income FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Notifications: users manage own
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Market prices: public read, admin manage
CREATE POLICY "Anyone can read market prices" ON public.market_prices FOR SELECT USING (true);
CREATE POLICY "Admins can manage market prices" ON public.market_prices FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Disease detections: users manage own
CREATE POLICY "Users can manage own detections" ON public.disease_detections FOR ALL USING (auth.uid() = user_id);

-- Soil analyses: users manage own
CREATE POLICY "Users can manage own soil analyses" ON public.soil_analyses FOR ALL USING (auth.uid() = user_id);

-- Trigger for new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'farmer');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_fields_updated_at();

CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms
  FOR EACH ROW EXECUTE FUNCTION public.update_fields_updated_at();

CREATE TRIGGER update_crop_history_updated_at BEFORE UPDATE ON public.crop_history
  FOR EACH ROW EXECUTE FUNCTION public.update_fields_updated_at();

-- Insert default crops
INSERT INTO public.crops (name, category, growing_season, water_requirement, days_to_harvest) VALUES
  ('Rice', 'Cereals', 'Kharif', 'High', 120),
  ('Wheat', 'Cereals', 'Rabi', 'Medium', 150),
  ('Cotton', 'Cash Crops', 'Kharif', 'Medium', 180),
  ('Sugarcane', 'Cash Crops', 'Annual', 'High', 365),
  ('Tomato', 'Vegetables', 'All Seasons', 'Medium', 90),
  ('Potato', 'Vegetables', 'Rabi', 'Medium', 100),
  ('Onion', 'Vegetables', 'Rabi', 'Low', 120),
  ('Maize', 'Cereals', 'Kharif', 'Medium', 100),
  ('Soybean', 'Pulses', 'Kharif', 'Medium', 90),
  ('Groundnut', 'Oilseeds', 'Kharif', 'Low', 120);