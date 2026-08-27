-- ============================================================================
-- Revibase — correctif : trigger de validation des réponses
-- ----------------------------------------------------------------------------
-- À exécuter UNIQUEMENT si tu as appliqué 0001 avant ce correctif.
-- (Un nouveau projet qui exécute 0001 à jour n'en a pas besoin — mais le
--  relancer ne fait aucun mal : `create or replace` est idempotent.)
--
-- Problème corrigé : la version initiale exigeait un `auth.uid()` non nul,
-- ce qui bloquait toute opération faite sans session (éditeur SQL, seed,
-- service_role) avec :
--   ERROR: Seul un formateur de la classe peut valider une réponse
--
-- Nouvelle règle : la vérification "formateur" ne s'applique qu'à un
-- utilisateur authentifié. Sans session (serveur / admin / seed), on fait
-- confiance à l'appelant et on conserve `validated_by` tel quel.
-- ============================================================================

create or replace function public.enforce_answer_validation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.validated_by is not null
     and (tg_op = 'INSERT' or new.validated_by is distinct from old.validated_by)
  then
    if auth.uid() is not null then
      if not public.is_class_trainer(public.question_class(new.question_id)) then
        raise exception 'Seul un formateur de la classe peut valider une réponse';
      end if;
      new.validated_by := auth.uid();
    end if;
    new.validated_at := now();
  end if;

  if new.validated_by is null then
    new.validated_at := null;
  end if;

  return new;
end;
$$;
