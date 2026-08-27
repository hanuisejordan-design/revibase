-- ============================================================================
-- Revibase — durcissement du trigger de validation des réponses
-- ----------------------------------------------------------------------------
-- La version précédente empêchait bien un non-formateur de POSER une
-- validation, mais pas de la RETIRER (mettre `validated_by` à NULL) : l'auteur
-- de la réponse passe la RLS `answers_update_author_or_trainer` sur sa propre
-- réponse. On ajoute la garde symétrique.
--
-- Ré-exécutable (create or replace).
-- ============================================================================

create or replace function public.enforce_answer_validation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Poser une validation (ou la changer) : réservé à un formateur de la classe.
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

  -- Retirer une validation existante : également réservé à un formateur
  -- (sauf contexte serveur/admin sans session).
  if tg_op = 'UPDATE'
     and old.validated_by is not null
     and new.validated_by is null
     and auth.uid() is not null
     and not public.is_class_trainer(public.question_class(new.question_id))
  then
    raise exception 'Seul un formateur de la classe peut retirer une validation';
  end if;

  if new.validated_by is null then
    new.validated_at := null;
  end if;

  return new;
end;
$$;
