-- ============================================================
-- EXECUTE ESTE SQL NO SUPABASE:
-- Dashboard → SQL Editor → New query → cole tudo → Run
-- ============================================================

-- Garante constraint única em cliente_email (necessário para upsert)
-- Se já existir, o comando é ignorado sem erro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'missoes_progresso_cliente_email_key'
  ) THEN
    ALTER TABLE missoes_progresso ADD CONSTRAINT missoes_progresso_cliente_email_key UNIQUE (cliente_email);
  END IF;
END;
$$;

-- missoes_progresso: libera INSERT, UPDATE e SELECT para anon
ALTER TABLE missoes_progresso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_missoes_progresso"  ON missoes_progresso;
DROP POLICY IF EXISTS "anon_insert_missoes_progresso"  ON missoes_progresso;
DROP POLICY IF EXISTS "anon_update_missoes_progresso"  ON missoes_progresso;

CREATE POLICY "anon_select_missoes_progresso"
  ON missoes_progresso FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_missoes_progresso"
  ON missoes_progresso FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_missoes_progresso"
  ON missoes_progresso FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- cupons_conquistados: libera INSERT, UPDATE, SELECT e DELETE para anon
ALTER TABLE cupons_conquistados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cupons_conquistados"  ON cupons_conquistados;
DROP POLICY IF EXISTS "anon_insert_cupons_conquistados"  ON cupons_conquistados;
DROP POLICY IF EXISTS "anon_update_cupons_conquistados"  ON cupons_conquistados;
DROP POLICY IF EXISTS "anon_delete_cupons_conquistados"  ON cupons_conquistados;

CREATE POLICY "anon_select_cupons_conquistados"
  ON cupons_conquistados FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_cupons_conquistados"
  ON cupons_conquistados FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_cupons_conquistados"
  ON cupons_conquistados FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_cupons_conquistados"
  ON cupons_conquistados FOR DELETE TO anon USING (true);

-- pedidos: garante UPDATE para anon (aprovar/ignorar missao_status)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pedidos"  ON pedidos;
DROP POLICY IF EXISTS "anon_insert_pedidos"  ON pedidos;
DROP POLICY IF EXISTS "anon_update_pedidos"  ON pedidos;

CREATE POLICY "anon_select_pedidos"
  ON pedidos FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_pedidos"
  ON pedidos FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_pedidos"
  ON pedidos FOR UPDATE TO anon USING (true) WITH CHECK (true);
