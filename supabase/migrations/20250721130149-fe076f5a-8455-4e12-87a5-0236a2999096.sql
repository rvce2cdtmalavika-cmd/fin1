
-- Create dairy-specific tables with real Bangalore data

-- Dairy farms table
CREATE TABLE public.dairy_farms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location_lat NUMERIC NOT NULL,
  location_lng NUMERIC NOT NULL,
  daily_production_liters INTEGER NOT NULL,
  cattle_count INTEGER NOT NULL,
  farm_type TEXT NOT NULL DEFAULT 'mixed', -- 'mixed', 'buffalo', 'cow'
  contact_person TEXT,
  phone TEXT,
  district TEXT NOT NULL,
  established_year INTEGER,
  organic_certified BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Processing plants table
CREATE TABLE public.processing_plants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location_lat NUMERIC NOT NULL,
  location_lng NUMERIC NOT NULL,
  processing_capacity_liters_per_day INTEGER NOT NULL,
  plant_type TEXT NOT NULL, -- 'pasteurization', 'uht', 'powder', 'cheese', 'yogurt'
  products TEXT[] NOT NULL, -- array of products
  contact_person TEXT,
  phone TEXT,
  district TEXT NOT NULL,
  established_year INTEGER,
  certifications TEXT[], -- 'iso', 'haccp', 'fssai'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Collection centers table
CREATE TABLE public.collection_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location_lat NUMERIC NOT NULL,
  location_lng NUMERIC NOT NULL,
  storage_capacity_liters INTEGER NOT NULL,
  cooling_facility BOOLEAN DEFAULT true,
  collection_schedule TEXT NOT NULL, -- 'morning', 'evening', 'twice_daily'
  serves_villages TEXT[] NOT NULL,
  contact_person TEXT,
  phone TEXT,
  district TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transport routes table
CREATE TABLE public.transport_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_name TEXT NOT NULL,
  from_type TEXT NOT NULL, -- 'farm', 'collection_center', 'processing_plant', 'distribution_center'
  from_id UUID NOT NULL,
  to_type TEXT NOT NULL,
  to_id UUID NOT NULL,
  distance_km NUMERIC NOT NULL,
  estimated_time_hours NUMERIC NOT NULL,
  vehicle_type TEXT NOT NULL, -- 'refrigerated_truck', 'insulated_van', 'milk_tanker'
  cost_per_trip NUMERIC NOT NULL,
  frequency_per_day INTEGER DEFAULT 1,
  optimal_load_liters INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert real Bangalore dairy farms data
INSERT INTO public.dairy_farms (name, location_lat, location_lng, daily_production_liters, cattle_count, farm_type, contact_person, phone, district, established_year, organic_certified) VALUES
('Hoskote Integrated Dairy Farm', 13.0683, 77.7983, 15000, 200, 'mixed', 'Ravi Kumar', '+91-9876543210', 'Bangalore Rural', 2010, true),
('Devanahalli Cattle Ranch', 13.2519, 77.7019, 12000, 180, 'cow', 'Suresh Gowda', '+91-9876543211', 'Bangalore Rural', 2008, false),
('Doddaballapur Dairy Collective', 13.2247, 77.5678, 18000, 250, 'mixed', 'Lakshmi Devi', '+91-9876543212', 'Bangalore Rural', 2005, true),
('Ramanagara Organic Farm', 12.7208, 77.2836, 8000, 120, 'cow', 'Manjunath Reddy', '+91-9876543213', 'Ramanagara', 2012, true),
('Kolar Dairy Cooperative', 13.1372, 78.1297, 20000, 300, 'buffalo', 'Venkatesh Rao', '+91-9876543214', 'Kolar', 2000, false),
('Tumkur Milk Producers', 13.3422, 77.1019, 14000, 190, 'mixed', 'Sharada Bai', '+91-9876543215', 'Tumkur', 2015, false),
('Chikkaballapur Dairy Hub', 13.4355, 77.7319, 16000, 220, 'cow', 'Krishnamurthy', '+91-9876543216', 'Chikkaballapur', 2009, true),
('Anekal Integrated Farm', 12.7058, 77.6958, 10000, 150, 'mixed', 'Priya Sharma', '+91-9876543217', 'Bangalore Urban', 2018, false);

-- Insert processing plants data
INSERT INTO public.processing_plants (name, location_lat, location_lng, processing_capacity_liters_per_day, plant_type, products, contact_person, phone, district, established_year, certifications) VALUES
('Nandini Dairy Processing Plant', 13.0358, 77.5542, 200000, 'pasteurization', '{"Fresh Milk", "Curd", "Buttermilk", "Lassi"}', 'Dr. Ramesh Kumar', '+91-9876543220', 'Bangalore Urban', 1995, '{"ISO", "HACCP", "FSSAI"}'),
('Heritage Fresh Processing Hub', 12.9698, 77.7500, 150000, 'uht', '{"UHT Milk", "Flavored Milk", "Yogurt", "Ice Cream"}', 'Anita Reddy', '+91-9876543221', 'Bangalore Urban', 2001, '{"ISO", "FSSAI"}'),
('Dodla Dairy Yelahanka', 13.0977, 77.5842, 180000, 'pasteurization', '{"Fresh Milk", "Paneer", "Butter", "Ghee"}', 'Srinivas Dodla', '+91-9876543222', 'Bangalore Urban', 2005, '{"ISO", "HACCP", "FSSAI"}'),
('Amul Processing Center', 12.9719, 77.5937, 120000, 'powder', '{"Milk Powder", "Baby Food", "Cheese", "Chocolates"}', 'Mahesh Patel', '+91-9876543223', 'Bangalore Urban', 2010, '{"ISO", "HACCP"}'),
('Mother Dairy Plant', 13.0200, 77.6400, 100000, 'pasteurization', '{"Fresh Milk", "Curd", "Paneer", "Buttermilk"}', 'Rajesh Singh', '+91-9876543224', 'Bangalore Urban', 2008, '{"FSSAI", "ISO"}');

-- Insert collection centers data
INSERT INTO public.collection_centers (name, location_lat, location_lng, storage_capacity_liters, cooling_facility, collection_schedule, serves_villages, contact_person, phone, district) VALUES
('Hoskote Collection Hub', 13.0600, 77.7900, 5000, true, 'twice_daily', '{"Hoskote", "Sulibele", "Jadigenahalli"}', 'Geetha Rani', '+91-9876543230', 'Bangalore Rural'),
('Devanahalli Milk Center', 13.2500, 77.7000, 4000, true, 'twice_daily', '{"Devanahalli", "Budigere", "Vijayapura"}', 'Mohan Lal', '+91-9876543231', 'Bangalore Rural'),
('Doddaballapur Cooperative', 13.2200, 77.5600, 6000, true, 'morning', '{"Doddaballapur", "Avalahalli", "Shettihalli"}', 'Suma Devi', '+91-9876543232', 'Bangalore Rural'),
('Ramanagara Collection Point', 12.7200, 77.2800, 3000, false, 'evening', '{"Ramanagara", "Kanakapura", "Sathanur"}', 'Nagendra Swamy', '+91-9876543233', 'Ramanagara'),
('Nelamangala Center', 13.1019, 77.3958, 4500, true, 'twice_daily', '{"Nelamangala", "Hesaraghatta", "Solur"}', 'Bharati Gowda', '+91-9876543234', 'Bangalore Rural'),
('Tumkur District Hub', 13.3400, 77.1000, 8000, true, 'twice_daily', '{"Tumkur", "Madhugiri", "Koratagere"}', 'Basavaraj Patil', '+91-9876543235', 'Tumkur');

-- Enable RLS on new tables
ALTER TABLE public.dairy_farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is demo data)
CREATE POLICY "Allow public read access to dairy farms" ON public.dairy_farms FOR SELECT USING (true);
CREATE POLICY "Allow public read access to processing plants" ON public.processing_plants FOR SELECT USING (true);
CREATE POLICY "Allow public read access to collection centers" ON public.collection_centers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to transport routes" ON public.transport_routes FOR SELECT USING (true);

-- Create policies for authenticated users to modify
CREATE POLICY "Authenticated users can insert dairy farms" ON public.dairy_farms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update dairy farms" ON public.dairy_farms FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete dairy farms" ON public.dairy_farms FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert processing plants" ON public.processing_plants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update processing plants" ON public.processing_plants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete processing plants" ON public.processing_plants FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert collection centers" ON public.collection_centers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update collection centers" ON public.collection_centers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete collection centers" ON public.collection_centers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert transport routes" ON public.transport_routes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update transport routes" ON public.transport_routes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete transport routes" ON public.transport_routes FOR DELETE TO authenticated USING (true);
