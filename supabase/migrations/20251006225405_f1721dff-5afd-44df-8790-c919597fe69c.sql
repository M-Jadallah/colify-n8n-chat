-- Create enum for connection status
CREATE TYPE public.connection_status AS ENUM ('disconnected', 'connecting', 'connected', 'error');

-- Create enum for message types
CREATE TYPE public.message_type AS ENUM ('text', 'image', 'video', 'audio', 'document', 'location', 'contact');

-- Create whatsapp_connections table
CREATE TABLE public.whatsapp_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT,
  status connection_status NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  webhook_url TEXT,
  n8n_webhook_url TEXT,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create triggers table
CREATE TABLE public.whatsapp_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'message_received', 'keyword', 'specific_sender'
  trigger_value TEXT,
  action_type TEXT NOT NULL, -- 'n8n_webhook', 'auto_reply', 'forward'
  action_data JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for history
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
  message_type message_type NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_connections
CREATE POLICY "Users can view their own connections"
  ON public.whatsapp_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections"
  ON public.whatsapp_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
  ON public.whatsapp_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
  ON public.whatsapp_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for whatsapp_triggers
CREATE POLICY "Users can view triggers for their connections"
  ON public.whatsapp_triggers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_connections
      WHERE id = connection_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create triggers for their connections"
  ON public.whatsapp_triggers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whatsapp_connections
      WHERE id = connection_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update triggers for their connections"
  ON public.whatsapp_triggers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_connections
      WHERE id = connection_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete triggers for their connections"
  ON public.whatsapp_triggers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_connections
      WHERE id = connection_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for whatsapp_messages
CREATE POLICY "Users can view messages for their connections"
  ON public.whatsapp_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_connections
      WHERE id = connection_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages for their connections"
  ON public.whatsapp_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whatsapp_connections
      WHERE id = connection_id AND user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_whatsapp_connections_updated_at
  BEFORE UPDATE ON public.whatsapp_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_triggers_updated_at
  BEFORE UPDATE ON public.whatsapp_triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();