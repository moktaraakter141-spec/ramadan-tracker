
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  habit_names TEXT[] := ARRAY[
    'পাঁচ ওয়াক্ত সালাত',
    'তারাবীহ / কিয়ামুল লাইল',
    'দৈনিক কুরআন তিলাওয়াত',
    '১০০ বার ইস্তিগফার',
    'সকাল–সন্ধ্যার যিকির',
    'গীবত ও মিথ্যা থেকে বিরত',
    'চোখ–জিহ্বা হেফাজত',
    'রাগ নিয়ন্ত্রণ / সবর',
    'দৈনিক সাদাকাহ',
    'পরিবারকে সহায়তা',
    'কাউকে ক্ষমা করা',
    'সোশ্যাল মিডিয়া নিয়ন্ত্রণ',
    'কৃতজ্ঞতার ৩টি বিষয়',
    'আত্মসমালোচনা',
    'কারো জন্য গোপনে দোয়া'
  ];
  i INT;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'ব্যবহারকারী'));

  -- Seed 15 default habits
  FOR i IN 1..array_length(habit_names, 1) LOOP
    INSERT INTO public.habits (user_id, name, is_custom, sort_order)
    VALUES (NEW.id, habit_names[i], false, i);
  END LOOP;

  RETURN NEW;
END;
$function$;
