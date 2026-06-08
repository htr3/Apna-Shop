-- Seed ~1 year of realistic dummy data for owner (mobile_no = 9999999999, user_id = 1)
DO $$
DECLARE
  v_mobile text := '9999999999';
  v_user   int  := 1;

  v_day        date;
  v_sales_today int;
  i int; j int;
  v_num_items  int;
  v_qty        int;
  v_sale_id    int;
  v_customer_id int;
  v_subtotal   numeric;
  v_discount   numeric;
  v_disc_type  text;
  v_disc_value numeric;
  v_total      numeric;
  v_paid       numeric;
  v_pending    numeric;
  v_pm         text;
  v_items      jsonb;
  v_ts         timestamp;
  v_due        timestamp;
  prod         RECORD;
  v_cust_ids   int[];

  v_prod_names  text[] := ARRAY['Rice 5kg','Wheat Flour 10kg','Sugar 1kg','Toor Dal 1kg','Sunflower Oil 1L','Tea 500g','Salt 1kg','Milk 1L','Bread','Eggs (dozen)','Biscuits Pack','Detergent 1kg','Soap Bar','Shampoo 200ml','Toothpaste','Cooking Gas Lighter','Maggi Noodles','Cold Drink 750ml','Potato Chips','Chocolate Bar'];
  v_prod_prices numeric[] := ARRAY[280,420,45,130,165,210,22,60,40,84,30,140,35,95,55,25,14,40,20,50];
  v_prod_units  text[] := ARRAY['Bag','Bag','Kg','Kg','Litre','Pack','Kg','Litre','Piece','Dozen','Pack','Pack','Piece','Bottle','Piece','Piece','Pack','Bottle','Pack','Piece'];
  v_prod_cats   text[] := ARRAY['Grocery','Grocery','Grocery','Grocery','Grocery','Beverages','Grocery','Dairy','Bakery','Dairy','Snacks','Household','Household','Personal Care','Personal Care','Household','Snacks','Beverages','Snacks','Snacks'];

  v_cust_names text[] := ARRAY['Ramesh Kumar','Sunita Devi','Amit Sharma','Priya Singh','Vijay Patel','Anita Gupta','Suresh Yadav','Meena Kumari','Rajesh Verma','Pooja Joshi','Manoj Tiwari','Kavita Rao','Deepak Nair','Geeta Shah','Arjun Reddy'];
  k int;
BEGIN
  -- Products
  FOR k IN 1..array_length(v_prod_names,1) LOOP
    INSERT INTO products (mobile_no, user_id, name, price, quantity, unit, category, is_active, created_at, updated_at)
    VALUES (v_mobile, v_user, v_prod_names[k], v_prod_prices[k], 50 + floor(random()*150)::int,
            v_prod_units[k], v_prod_cats[k], true, now() - INTERVAL '365 days', now());
  END LOOP;

  -- Customers
  FOR k IN 1..array_length(v_cust_names,1) LOOP
    INSERT INTO customers (mobile_no, user_id, name, phone, trust_score, total_purchase, borrowed_amount, is_risky)
    VALUES (v_mobile, v_user, v_cust_names[k], '98' || lpad((10000000 + floor(random()*89999999)::int)::text, 8, '0'),
            70 + floor(random()*30)::int, 0, 0, false);
  END LOOP;

  SELECT array_agg(id) INTO v_cust_ids FROM customers WHERE mobile_no = v_mobile;

  -- Sales across the last 365 days
  v_day := (CURRENT_DATE - INTERVAL '365 days')::date;
  WHILE v_day <= CURRENT_DATE LOOP
    v_sales_today := floor(random()*6)::int;  -- 0..5 sales per day
    FOR i IN 1..v_sales_today LOOP
      v_items := '[]'::jsonb;
      v_subtotal := 0;
      v_num_items := 1 + floor(random()*4)::int;  -- 1..4 products
      FOR j IN 1..v_num_items LOOP
        SELECT id, name, price INTO prod
        FROM products WHERE mobile_no = v_mobile ORDER BY random() LIMIT 1;
        v_qty := 1 + floor(random()*5)::int;
        v_subtotal := v_subtotal + prod.price * v_qty;
        v_items := v_items || jsonb_build_object(
          'productId', prod.id, 'productName', prod.name, 'quantity', v_qty, 'price', prod.price);
      END LOOP;

      -- Discount on ~30% of sales
      v_disc_type := 'RUPEES'; v_disc_value := 0; v_discount := 0;
      IF random() < 0.3 THEN
        IF random() < 0.5 THEN
          v_disc_type := 'PERCENT';
          v_disc_value := (ARRAY[5,10,15,20])[1 + floor(random()*4)::int];
          v_discount := round(v_subtotal * v_disc_value / 100, 2);
        ELSE
          v_disc_type := 'RUPEES';
          v_disc_value := (ARRAY[10,20,50,100])[1 + floor(random()*4)::int];
          v_discount := LEAST(v_disc_value, v_subtotal);
        END IF;
      END IF;
      v_total := v_subtotal - v_discount;

      -- 60% of sales tied to a known customer
      IF random() < 0.6 THEN
        v_customer_id := v_cust_ids[1 + floor(random()*array_length(v_cust_ids,1))::int];
      ELSE
        v_customer_id := NULL;
      END IF;

      v_pm := (ARRAY['CASH','ONLINE','CREDIT'])[1 + floor(random()*3)::int];

      IF v_pm = 'CREDIT' AND v_customer_id IS NOT NULL THEN
        v_paid := round((v_total * (random()*0.6))::numeric, 2);
        v_pending := v_total - v_paid;
      ELSE
        v_paid := v_total;
        v_pending := 0;
      END IF;

      v_ts := v_day + INTERVAL '9 hours' + (random() * INTERVAL '12 hours');

      INSERT INTO sales (mobile_no, user_id, amount, paid_amount, pending_amount, date,
                         payment_method, customer_id, discount, discount_type, discount_value, items)
      VALUES (v_mobile, v_user, v_total, v_paid, v_pending, v_ts,
              v_pm, v_customer_id, v_discount, v_disc_type, v_disc_value, v_items::text)
      RETURNING id INTO v_sale_id;

      IF v_pending > 0 AND v_customer_id IS NOT NULL THEN
        v_due := v_ts + INTERVAL '15 days';
        INSERT INTO borrowings (mobile_no, customer_id, amount, date, due_date, status, notes)
        VALUES (v_mobile, v_customer_id, v_pending, v_ts, v_due,
                CASE WHEN v_due < now() THEN 'OVERDUE' ELSE 'PENDING' END,
                'Udhaar from sale #' || v_sale_id);
      END IF;
    END LOOP;
    v_day := v_day + 1;
  END LOOP;

  -- Recompute customer aggregates from generated data
  UPDATE customers c SET
    total_purchase  = COALESCE((SELECT sum(amount) FROM sales s WHERE s.customer_id = c.id), 0),
    borrowed_amount = COALESCE((SELECT sum(b.amount) FROM borrowings b WHERE b.customer_id = c.id AND b.status <> 'PAID'), 0)
  WHERE c.mobile_no = v_mobile;

  UPDATE customers SET is_risky = true
  WHERE mobile_no = v_mobile AND borrowed_amount > 2000;
END $$;
