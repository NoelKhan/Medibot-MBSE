import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoctorsModule1730419300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create doctor_profiles table
    await queryRunner.query(`
      CREATE TABLE doctor_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(100) NOT NULL,
        specialty VARCHAR(100) NOT NULL,
        bio TEXT,
        years_of_experience INT NOT NULL,
        education TEXT,
        certifications TEXT,
        languages VARCHAR(255)[],
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
        total_reviews INT DEFAULT 0,
        consultation_fee DECIMAL(10, 2) NOT NULL,
        consultation_duration INT DEFAULT 30,
        profile_image_url TEXT,
        hospital_affiliation VARCHAR(100),
        office_address TEXT,
        phone_number VARCHAR(20),
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for doctor_profiles
    await queryRunner.query(`
      CREATE INDEX idx_doctor_profiles_full_name ON doctor_profiles(full_name);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_doctor_profiles_specialty_status ON doctor_profiles(specialty, status);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_doctor_profiles_years ON doctor_profiles(years_of_experience);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_doctor_profiles_rating ON doctor_profiles(rating);
    `);

    // Create doctor_schedules table
    await queryRunner.query(`
      CREATE TABLE doctor_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        day_of_week VARCHAR(20) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        slot_duration INT DEFAULT 30,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for doctor_schedules
    await queryRunner.query(`
      CREATE INDEX idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_doctor_schedules_doctor_day ON doctor_schedules(doctor_id, day_of_week);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_doctor_schedules_active ON doctor_schedules(is_active);
    `);

    // Create doctor_time_offs table
    await queryRunner.query(`
      CREATE TABLE doctor_time_offs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for doctor_time_offs
    await queryRunner.query(`
      CREATE INDEX idx_doctor_time_offs_doctor_id ON doctor_time_offs(doctor_id);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_doctor_time_offs_start_date ON doctor_time_offs(start_date);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_doctor_time_offs_end_date ON doctor_time_offs(end_date);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_doctor_time_offs_dates ON doctor_time_offs(doctor_id, start_date, end_date);
    `);

    // Seed sample doctors with realistic data
    await queryRunner.query(`
      INSERT INTO doctor_profiles (
        full_name, specialty, bio, years_of_experience, education, certifications,
        languages, status, rating, total_reviews, consultation_fee, consultation_duration,
        hospital_affiliation, office_address, phone_number, email
      ) VALUES
      -- General Practitioners
      ('Dr. Sarah Johnson', 'General Practitioner', 
       'Experienced family physician with a holistic approach to healthcare. Specializes in preventive care and chronic disease management.',
       12, 'MD from Johns Hopkins University', 'Board Certified in Family Medicine',
       ARRAY['English', 'Spanish'], 'active', 4.8, 245, 75.00, 30,
       'City General Hospital', '123 Main St, Suite 100', '+1-555-0101', 'sjohnson@medibot.com'),

      ('Dr. Michael Chen', 'General Practitioner',
       'Dedicated to providing comprehensive primary care for patients of all ages. Focus on patient education and preventive medicine.',
       8, 'MD from Stanford University', 'Board Certified in Family Medicine',
       ARRAY['English', 'Mandarin'], 'active', 4.6, 189, 70.00, 30,
       'Bay Area Medical Center', '456 Oak Ave, Floor 2', '+1-555-0102', 'mchen@medibot.com'),

      -- Cardiologists
      ('Dr. Emily Rodriguez', 'Cardiologist',
       'Interventional cardiologist specializing in coronary artery disease and heart failure management. Published researcher in cardiovascular medicine.',
       15, 'MD from Harvard Medical School, Cardiology Fellowship at Mayo Clinic', 'Board Certified in Cardiovascular Disease',
       ARRAY['English', 'Spanish', 'Portuguese'], 'active', 4.9, 312, 200.00, 45,
       'Heart & Vascular Institute', '789 Cardio Blvd, Suite 300', '+1-555-0201', 'erodriguez@medibot.com'),

      ('Dr. James Williams', 'Cardiologist',
       'Expert in preventive cardiology and non-invasive cardiac imaging. Helps patients manage heart disease risk factors.',
       10, 'MD from UCLA School of Medicine', 'Board Certified in Cardiology',
       ARRAY['English'], 'active', 4.7, 178, 180.00, 45,
       'Cardiovascular Specialists', '321 Heart Lane', '+1-555-0202', 'jwilliams@medibot.com'),

      -- Dermatologists
      ('Dr. Lisa Anderson', 'Dermatologist',
       'Board-certified dermatologist with expertise in medical, surgical, and cosmetic dermatology. Passionate about skin cancer prevention.',
       11, 'MD from University of Pennsylvania', 'Board Certified in Dermatology',
       ARRAY['English', 'French'], 'active', 4.8, 267, 150.00, 30,
       'Skin Health Center', '555 Derma Drive', '+1-555-0301', 'landerson@medibot.com'),

      -- Pediatricians
      ('Dr. Robert Martinez', 'Pediatrician',
       'Compassionate pediatrician dedicated to promoting child health and development. Special interest in childhood nutrition and behavioral health.',
       14, 'MD from Columbia University', 'Board Certified in Pediatrics',
       ARRAY['English', 'Spanish'], 'active', 4.9, 421, 90.00, 30,
       'Children''s Healthcare', '777 Kids Plaza', '+1-555-0401', 'rmartinez@medibot.com'),

      ('Dr. Amanda Thompson', 'Pediatrician',
       'Experienced in newborn care and adolescent medicine. Creates a friendly environment for children and families.',
       9, 'MD from Duke University', 'Board Certified in Pediatrics',
       ARRAY['English'], 'active', 4.7, 298, 85.00, 30,
       'Pediatric Associates', '888 Family Way', '+1-555-0402', 'athompson@medibot.com'),

      -- Psychiatrists
      ('Dr. David Kim', 'Psychiatrist',
       'Specializes in anxiety, depression, and mood disorders. Combines medication management with evidence-based therapy approaches.',
       13, 'MD from Yale School of Medicine, Psychiatry Residency at Massachusetts General', 'Board Certified in Psychiatry',
       ARRAY['English', 'Korean'], 'active', 4.8, 234, 175.00, 45,
       'Mental Wellness Center', '999 Mind St', '+1-555-0501', 'dkim@medibot.com'),

      -- Orthopedists
      ('Dr. Christopher Brown', 'Orthopedist',
       'Orthopedic surgeon specializing in sports medicine and joint replacement. Treats athletes and active individuals.',
       16, 'MD from University of Michigan, Orthopedic Surgery Fellowship', 'Board Certified in Orthopedic Surgery',
       ARRAY['English'], 'active', 4.9, 356, 225.00, 45,
       'Orthopedic Sports Institute', '111 Bone Ave', '+1-555-0601', 'cbrown@medibot.com'),

      -- Neurologists
      ('Dr. Jennifer Lee', 'Neurologist',
       'Neurologist with expertise in headache disorders, epilepsy, and movement disorders. Patient-centered approach to neurological care.',
       11, 'MD from Northwestern University', 'Board Certified in Neurology',
       ARRAY['English', 'Korean', 'Spanish'], 'active', 4.7, 201, 190.00, 45,
       'Neurology Associates', '222 Brain Boulevard', '+1-555-0701', 'jlee@medibot.com'),

      -- Gastroenterologists
      ('Dr. Thomas Garcia', 'Gastroenterologist',
       'Expert in digestive health, liver disease, and endoscopic procedures. Focuses on inflammatory bowel disease management.',
       12, 'MD from Johns Hopkins, GI Fellowship', 'Board Certified in Gastroenterology',
       ARRAY['English', 'Spanish'], 'active', 4.8, 189, 195.00, 45,
       'Digestive Health Clinic', '333 GI Way', '+1-555-0801', 'tgarcia@medibot.com'),

      -- Ophthalmologists
      ('Dr. Patricia White', 'Ophthalmologist',
       'Comprehensive eye care including cataract surgery and management of glaucoma and macular degeneration.',
       14, 'MD from University of California San Francisco', 'Board Certified in Ophthalmology',
       ARRAY['English'], 'active', 4.9, 312, 160.00, 30,
       'Eye Care Specialists', '444 Vision Plaza', '+1-555-0901', 'pwhite@medibot.com'),

      -- ENT Specialists
      ('Dr. Kevin Patel', 'ENT Specialist',
       'Ear, nose, and throat specialist with expertise in sinus disorders, hearing loss, and throat conditions.',
       10, 'MD from Emory University', 'Board Certified in Otolaryngology',
       ARRAY['English', 'Hindi', 'Gujarati'], 'active', 4.7, 178, 170.00, 30,
       'ENT Health Center', '555 Ear Lane', '+1-555-1001', 'kpatel@medibot.com');
    `);

    // Seed typical weekday schedules for all doctors
    await queryRunner.query(`
      INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active)
      SELECT 
        dp.id,
        day_name,
        '09:00'::time,
        '17:00'::time,
        CASE 
          WHEN dp.specialty IN ('Cardiologist', 'Psychiatrist', 'Neurologist', 'Orthopedist') THEN 45
          ELSE 30
        END,
        TRUE
      FROM doctor_profiles dp
      CROSS JOIN (
        VALUES ('Monday'), ('Tuesday'), ('Wednesday'), ('Thursday'), ('Friday')
      ) AS days(day_name)
      WHERE dp.status = 'active';
    `);

    // Add some Saturday schedules for select doctors (half day)
    await queryRunner.query(`
      INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active)
      SELECT 
        dp.id,
        'Saturday',
        '09:00'::time,
        '13:00'::time,
        CASE 
          WHEN dp.specialty IN ('Cardiologist', 'Psychiatrist') THEN 45
          ELSE 30
        END,
        TRUE
      FROM doctor_profiles dp
      WHERE dp.specialty IN ('General Practitioner', 'Pediatrician', 'Dermatologist')
      AND dp.status = 'active'
      LIMIT 5;
    `);

    // Add sample time-off periods
    await queryRunner.query(`
      INSERT INTO doctor_time_offs (doctor_id, start_date, end_date, reason, notes)
      SELECT 
        dp.id,
        CURRENT_DATE + INTERVAL '15 days',
        CURRENT_DATE + INTERVAL '20 days',
        'vacation',
        'Annual vacation'
      FROM doctor_profiles dp
      WHERE dp.full_name IN ('Dr. Sarah Johnson', 'Dr. Emily Rodriguez')
      LIMIT 2;
    `);

    console.log('✅ Doctors module migration completed successfully');
    console.log('   - Created 3 tables: doctor_profiles, doctor_schedules, doctor_time_offs');
    console.log('   - Created 11 indexes for query optimization');
    console.log('   - Seeded 13 doctors across 10 specialties');
    console.log('   - Configured weekday schedules for all doctors');
    console.log('   - Added Saturday hours for some specialties');
    console.log('   - Added sample time-off records');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS doctor_time_offs CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS doctor_schedules CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS doctor_profiles CASCADE`);
    console.log('✅ Doctors module migration rolled back');
  }
}
