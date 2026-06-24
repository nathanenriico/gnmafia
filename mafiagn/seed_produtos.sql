-- Execute no Supabase SQL Editor APÓS criar a tabela produtos
-- Insere todos os produtos existentes no site com suas imagens

INSERT INTO produtos (id, title, alt, category, price, images, created_at) VALUES

('prod-bobojaco-quicksilver', 'BOBOJACO QUICKSILVER', 'Bobojaco Quicksilver', 'bobojaco', 129.90,
 '["img-bobojaco-quicksilver/img1.jpeg","img-bobojaco-quicksilver/img2.jpeg","img-bobojaco-quicksilver/img3.jpeg","img-bobojaco-quicksilver/img4.jpeg","img-bobojaco-quicksilver/img5.jpeg","img-bobojaco-quicksilver/img6.jpeg","img-bobojaco-quicksilver/img7.jpeg","img-bobojaco-quicksilver/img8.jpeg","img-bobojaco-quicksilver/img9.jpeg"]',
 now() - interval '9 days'),

('prod-bobojaco-vermelho', 'BOBOJACO QUICKSILVER VERMELHO', 'Bobojaco Quicksilver Vermelho', 'bobojaco', 119.90,
 '["img-bobojaco/img1.jpeg","img-bobojaco/img2.jpeg","img-bobojaco/img3.jpeg","img-bobojaco/img4.jpeg","img-bobojaco/img5.jpeg"]',
 now() - interval '8 days'),

('prod-moletom-onbongo', 'MOLETOM ONBONGO', 'Moletom Onbongo', 'moletom', 259.90,
 '["img-moletom-onbongo/img2.jpeg","img-moletom-onbongo/img1.jpeg","img-moletom-onbongo/img3.jpeg","img-moletom-onbongo/img4.jpeg"]',
 now() - interval '7 days'),

('prod-conjunto-quicksilver', 'CONJUNTO QUICKSILVER', 'Conjunto Quicksilver', 'conjunto', 219.90,
 '["img-bobojaco-quicksilver/img5.jpeg","img-bobojaco-quicksilver/img6.jpeg","img-bobojaco-quicksilver/img7.jpeg"]',
 now() - interval '6 days'),

('prod-conjunto-onbongo', 'CONJUNTO ONBONGO', 'Conjunto Onbongo', 'conjunto', 239.90,
 '["img-moletom-onbongo/img3.jpeg","img-moletom-onbongo/img4.jpeg"]',
 now() - interval '5 days'),

('prod-camisa-quicksilver', 'CAMISA QUICKSILVER', 'Camisa Quicksilver', 'camisa', 89.90,
 '["img-bobojaco/img2.jpeg","img-bobojaco/img3.jpeg","img-bobojaco/img4.jpeg"]',
 now() - interval '4 days'),

('prod-camisa-onbongo', 'CAMISA ONBONGO', 'Camisa Onbongo', 'camisa', 79.90,
 '["img-moletom-onbongo/img1.jpeg"]',
 now() - interval '3 days'),

('prod-camisa-gn-classic', 'CAMISA GN CLASSIC', 'Camisa GN Classic', 'camisa', 69.90,
 '["img-bobojaco-quicksilver/img2.jpeg"]',
 now() - interval '3 days'),

('prod-bermuda-quicksilver', 'BERMUDA QUICKSILVER', 'Bermuda Quicksilver', 'bermuda', 99.90,
 '["img-bobojaco-quicksilver/img4.jpeg","img-bobojaco-quicksilver/img3.jpeg"]',
 now() - interval '2 days'),

('prod-bermuda-onbongo', 'BERMUDA ONBONGO', 'Bermuda Onbongo', 'bermuda', 89.90,
 '["img-moletom-onbongo/img4.jpeg"]',
 now() - interval '2 days'),

('prod-bermuda-gn-classic', 'BERMUDA GN CLASSIC', 'Bermuda GN Classic', 'bermuda', 79.90,
 '["img-bobojaco/img3.jpeg"]',
 now() - interval '2 days'),

('prod-corrente-gn-gold', 'CORRENTE GN GOLD', 'Corrente GN Gold', 'acessorio', 199.90,
 '["img-bobojaco/img5.jpeg"]',
 now() - interval '1 day'),

('prod-kit-atacado-camisas', 'KIT ATACADO 10 CAMISAS', 'Kit Atacado 10 Camisas', 'atacado', 499.90,
 '["img-bobojaco-quicksilver/img7.jpeg","img-bobojaco-quicksilver/img8.jpeg","img-bobojaco-quicksilver/img9.jpeg"]',
 now() - interval '1 day'),

('prod-kit-atacado-conjuntos', 'KIT ATACADO 5 CONJUNTOS', 'Kit Atacado 5 Conjuntos', 'atacado', 699.90,
 '["img-bobojaco-quicksilver/img8.jpeg","img-bobojaco-quicksilver/img9.jpeg"]',
 now())

ON CONFLICT (id) DO NOTHING;
