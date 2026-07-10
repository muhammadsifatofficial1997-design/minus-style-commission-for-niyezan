# Supabase Setup

এই app এখন Supabase-ready. Live data Supabase-এ রাখার জন্য:

1. Supabase project খুলুন।
2. `supabase/schema.sql` ফাইলের SQL Supabase Dashboard > SQL Editor-এ run করুন।
3. Authentication > Users থেকে Admin, Manager, Employee email/password user তৈরি করুন।
4. SQL Editor-এ প্রতিটি user-এর role বসান:

```sql
insert into public.employees (id, name, salary)
values
  ('faizur', 'Faizur', 15000),
  ('amit', 'Amit', 13000),
  ('sakib', 'Sakib', 12000)
on conflict (id) do update set name = excluded.name, salary = excluded.salary;

insert into public.profiles (id, email, role, employee_id, display_name)
values
  ('AUTH_USER_UUID_HERE', 'admin@email.com', 'admin', null, 'Admin'),
  ('AUTH_USER_UUID_HERE', 'manager@email.com', 'manager', 'faizur', 'Faizur'),
  ('AUTH_USER_UUID_HERE', 'employee@email.com', 'employee', 'amit', 'Amit')
on conflict (id) do update
set email = excluded.email,
    role = excluded.role,
    employee_id = excluded.employee_id,
    display_name = excluded.display_name,
    active = true;
```

5. Project Settings > API থেকে:
   - Project URL
   - anon public key

   app-এর Admin Settings > Supabase Backend card-এ paste করে `Supabase Config Save` দিন।

6. Admin হিসেবে login করে `Supabase-e pathan` চাপুন। এরপর অন্য PC/mobile থেকে email+password দিয়ে login করলে একই live data দেখাবে।

Security note:
- GitHub Pages frontend-এ শুধুমাত্র Supabase anon key থাকবে।
- Password Supabase Auth-এ থাকবে, localStorage/Google Sheet-এ থাকবে না।
- Row Level Security employee-কে নিজের employee_id ছাড়া অন্য data পড়তে দেয় না।
- Google Sheets এখন শুধু backup/report copy হিসেবে রাখবেন।
