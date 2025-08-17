ALTER TABLE public.documents
ADD CONSTRAINT documents_source_name_unique UNIQUE (source_name);
