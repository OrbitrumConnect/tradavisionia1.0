export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      backtesting_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          end_date: string
          id: string
          initial_capital: number
          metadata: Json | null
          results: Json | null
          session_name: string
          start_date: string
          status: string | null
          strategy_config: Json
          symbol: string
          timeframe: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          initial_capital?: number
          metadata?: Json | null
          results?: Json | null
          session_name: string
          start_date: string
          status?: string | null
          strategy_config?: Json
          symbol: string
          timeframe: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          initial_capital?: number
          metadata?: Json | null
          results?: Json | null
          session_name?: string
          start_date?: string
          status?: string | null
          strategy_config?: Json
          symbol?: string
          timeframe?: string
          user_id?: string
        }
        Relationships: []
      }
      bot_knowledge: {
        Row: {
          accuracy_score: number | null
          category: string
          content: string
          created_at: string | null
          examples: Json | null
          id: string
          metadata: Json | null
          topic: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          accuracy_score?: number | null
          category: string
          content: string
          created_at?: string | null
          examples?: Json | null
          id?: string
          metadata?: Json | null
          topic: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          accuracy_score?: number | null
          category?: string
          content?: string
          created_at?: string | null
          examples?: Json | null
          id?: string
          metadata?: Json | null
          topic?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          context_type: string | null
          conversation_id: string | null
          conversation_state: Json | null
          created_at: string | null
          embedding: string | null
          feedback_notes: string | null
          feedback_score: number | null
          feedback_timestamp: string | null
          id: string
          metadata: Json | null
          reference_chunks: string[] | null
          role: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          context_type?: string | null
          conversation_id?: string | null
          conversation_state?: Json | null
          created_at?: string | null
          embedding?: string | null
          feedback_notes?: string | null
          feedback_score?: number | null
          feedback_timestamp?: string | null
          id?: string
          metadata?: Json | null
          reference_chunks?: string[] | null
          role: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          context_type?: string | null
          conversation_id?: string | null
          conversation_state?: Json | null
          created_at?: string | null
          embedding?: string | null
          feedback_notes?: string | null
          feedback_score?: number | null
          feedback_timestamp?: string | null
          id?: string
          metadata?: Json | null
          reference_chunks?: string[] | null
          role?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_progress: {
        Row: {
          created_at: string | null
          id: string
          improvement_notes: string | null
          last_practice: string | null
          metadata: Json | null
          mistakes_count: number | null
          recommended_content: Json | null
          skill_level: number | null
          successes_count: number | null
          topic: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          improvement_notes?: string | null
          last_practice?: string | null
          metadata?: Json | null
          mistakes_count?: number | null
          recommended_content?: Json | null
          skill_level?: number | null
          successes_count?: number | null
          topic: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          improvement_notes?: string | null
          last_practice?: string | null
          metadata?: Json | null
          mistakes_count?: number | null
          recommended_content?: Json | null
          skill_level?: number | null
          successes_count?: number | null
          topic?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      market_features: {
        Row: {
          adx: number | null
          atr_14: number | null
          bollinger_lower: number | null
          bollinger_middle: number | null
          bollinger_upper: number | null
          bos_detected: boolean | null
          choch_detected: boolean | null
          close: number
          confidence_score: number | null
          created_at: string | null
          distance_to_resistance: number | null
          distance_to_support: number | null
          ema_20: number | null
          ema_200: number | null
          ema_50: number | null
          ema_9: number | null
          fvg_detected: boolean | null
          fvg_type: string | null
          high: number
          id: string
          labels: Json | null
          liquidity_sweep: boolean | null
          low: number
          macd: number | null
          macd_histogram: number | null
          macd_signal: number | null
          metadata: Json | null
          open: number
          order_block_detected: boolean | null
          order_block_type: string | null
          pattern_name: string | null
          resistance_level: number | null
          rsi_14: number | null
          signal_type: string | null
          spring_detected: boolean | null
          support_level: number | null
          symbol: string
          timeframe: string
          timestamp: string
          upthrust_detected: boolean | null
          volume: number
          volume_ma: number | null
          volume_spike: boolean | null
          volume_z_score: number | null
          vwap: number | null
        }
        Insert: {
          adx?: number | null
          atr_14?: number | null
          bollinger_lower?: number | null
          bollinger_middle?: number | null
          bollinger_upper?: number | null
          bos_detected?: boolean | null
          choch_detected?: boolean | null
          close: number
          confidence_score?: number | null
          created_at?: string | null
          distance_to_resistance?: number | null
          distance_to_support?: number | null
          ema_20?: number | null
          ema_200?: number | null
          ema_50?: number | null
          ema_9?: number | null
          fvg_detected?: boolean | null
          fvg_type?: string | null
          high: number
          id?: string
          labels?: Json | null
          liquidity_sweep?: boolean | null
          low: number
          macd?: number | null
          macd_histogram?: number | null
          macd_signal?: number | null
          metadata?: Json | null
          open: number
          order_block_detected?: boolean | null
          order_block_type?: string | null
          pattern_name?: string | null
          resistance_level?: number | null
          rsi_14?: number | null
          signal_type?: string | null
          spring_detected?: boolean | null
          support_level?: number | null
          symbol: string
          timeframe: string
          timestamp: string
          upthrust_detected?: boolean | null
          volume: number
          volume_ma?: number | null
          volume_spike?: boolean | null
          volume_z_score?: number | null
          vwap?: number | null
        }
        Update: {
          adx?: number | null
          atr_14?: number | null
          bollinger_lower?: number | null
          bollinger_middle?: number | null
          bollinger_upper?: number | null
          bos_detected?: boolean | null
          choch_detected?: boolean | null
          close?: number
          confidence_score?: number | null
          created_at?: string | null
          distance_to_resistance?: number | null
          distance_to_support?: number | null
          ema_20?: number | null
          ema_200?: number | null
          ema_50?: number | null
          ema_9?: number | null
          fvg_detected?: boolean | null
          fvg_type?: string | null
          high?: number
          id?: string
          labels?: Json | null
          liquidity_sweep?: boolean | null
          low?: number
          macd?: number | null
          macd_histogram?: number | null
          macd_signal?: number | null
          metadata?: Json | null
          open?: number
          order_block_detected?: boolean | null
          order_block_type?: string | null
          pattern_name?: string | null
          resistance_level?: number | null
          rsi_14?: number | null
          signal_type?: string | null
          spring_detected?: boolean | null
          support_level?: number | null
          symbol?: string
          timeframe?: string
          timestamp?: string
          upthrust_detected?: boolean | null
          volume?: number
          volume_ma?: number | null
          volume_spike?: boolean | null
          volume_z_score?: number | null
          vwap?: number | null
        }
        Relationships: []
      }
      market_m1: {
        Row: {
          close: number
          continuation_probability: number | null
          created_at: string | null
          direction: string | null
          ema_20: number | null
          ema_9: number | null
          high: number
          id: string
          low: number
          metadata: Json | null
          micro_insight: string | null
          open: number
          patterns_detected: Json | null
          rsi_14: number | null
          symbol: string
          timeframe: string
          timestamp: string
          volatility_level: string | null
          volume: number
          volume_spike: boolean | null
        }
        Insert: {
          close: number
          continuation_probability?: number | null
          created_at?: string | null
          direction?: string | null
          ema_20?: number | null
          ema_9?: number | null
          high: number
          id?: string
          low: number
          metadata?: Json | null
          micro_insight?: string | null
          open: number
          patterns_detected?: Json | null
          rsi_14?: number | null
          symbol: string
          timeframe?: string
          timestamp: string
          volatility_level?: string | null
          volume: number
          volume_spike?: boolean | null
        }
        Update: {
          close?: number
          continuation_probability?: number | null
          created_at?: string | null
          direction?: string | null
          ema_20?: number | null
          ema_9?: number | null
          high?: number
          id?: string
          low?: number
          metadata?: Json | null
          micro_insight?: string | null
          open?: number
          patterns_detected?: Json | null
          rsi_14?: number | null
          symbol?: string
          timeframe?: string
          timestamp?: string
          volatility_level?: string | null
          volume?: number
          volume_spike?: boolean | null
        }
        Relationships: []
      }
      market_m15: {
        Row: {
          close: number
          contextual_insight: string | null
          created_at: string | null
          high: number
          id: string
          indicator_weights: Json | null
          institutional_flow: string | null
          low: number
          m5_summary: Json | null
          major_pattern: string | null
          metadata: Json | null
          open: number
          pattern_maturity: number | null
          resistance_level: number | null
          support_level: number | null
          symbol: string
          timeframe: string
          timestamp: string
          total_volume: number
          trend_consistency: number | null
          trend_direction: string | null
        }
        Insert: {
          close: number
          contextual_insight?: string | null
          created_at?: string | null
          high: number
          id?: string
          indicator_weights?: Json | null
          institutional_flow?: string | null
          low: number
          m5_summary?: Json | null
          major_pattern?: string | null
          metadata?: Json | null
          open: number
          pattern_maturity?: number | null
          resistance_level?: number | null
          support_level?: number | null
          symbol: string
          timeframe?: string
          timestamp: string
          total_volume: number
          trend_consistency?: number | null
          trend_direction?: string | null
        }
        Update: {
          close?: number
          contextual_insight?: string | null
          created_at?: string | null
          high?: number
          id?: string
          indicator_weights?: Json | null
          institutional_flow?: string | null
          low?: number
          m5_summary?: Json | null
          major_pattern?: string | null
          metadata?: Json | null
          open?: number
          pattern_maturity?: number | null
          resistance_level?: number | null
          support_level?: number | null
          symbol?: string
          timeframe?: string
          timestamp?: string
          total_volume?: number
          trend_consistency?: number | null
          trend_direction?: string | null
        }
        Relationships: []
      }
      market_m30: {
        Row: {
          close: number
          created_at: string | null
          cycle_position: number | null
          expected_reaction_time: number | null
          high: number
          id: string
          low: number
          m15_summary: Json | null
          macro_trend: string | null
          market_phase: string | null
          metadata: Json | null
          noise_filtered: boolean | null
          open: number
          recent_accuracy: number | null
          strategic_insight: string | null
          symbol: string
          timeframe: string
          timestamp: string
          total_volume: number
          validated_confluences: Json | null
        }
        Insert: {
          close: number
          created_at?: string | null
          cycle_position?: number | null
          expected_reaction_time?: number | null
          high: number
          id?: string
          low: number
          m15_summary?: Json | null
          macro_trend?: string | null
          market_phase?: string | null
          metadata?: Json | null
          noise_filtered?: boolean | null
          open: number
          recent_accuracy?: number | null
          strategic_insight?: string | null
          symbol: string
          timeframe?: string
          timestamp: string
          total_volume: number
          validated_confluences?: Json | null
        }
        Update: {
          close?: number
          created_at?: string | null
          cycle_position?: number | null
          expected_reaction_time?: number | null
          high?: number
          id?: string
          low?: number
          m15_summary?: Json | null
          macro_trend?: string | null
          market_phase?: string | null
          metadata?: Json | null
          noise_filtered?: boolean | null
          open?: number
          recent_accuracy?: number | null
          strategic_insight?: string | null
          symbol?: string
          timeframe?: string
          timestamp?: string
          total_volume?: number
          validated_confluences?: Json | null
        }
        Relationships: []
      }
      market_m5: {
        Row: {
          avg_probability: number | null
          close: number
          created_at: string | null
          false_signals_count: number | null
          high: number
          id: string
          low: number
          m1_summary: Json | null
          metadata: Json | null
          micro_trend_pattern: string | null
          open: number
          pattern_confidence: number | null
          predominant_direction: string | null
          symbol: string
          tactical_insight: string | null
          timeframe: string
          timestamp: string
          total_volume: number
          trend_strength: number | null
          true_signals_count: number | null
        }
        Insert: {
          avg_probability?: number | null
          close: number
          created_at?: string | null
          false_signals_count?: number | null
          high: number
          id?: string
          low: number
          m1_summary?: Json | null
          metadata?: Json | null
          micro_trend_pattern?: string | null
          open: number
          pattern_confidence?: number | null
          predominant_direction?: string | null
          symbol: string
          tactical_insight?: string | null
          timeframe?: string
          timestamp: string
          total_volume: number
          trend_strength?: number | null
          true_signals_count?: number | null
        }
        Update: {
          avg_probability?: number | null
          close?: number
          created_at?: string | null
          false_signals_count?: number | null
          high?: number
          id?: string
          low?: number
          m1_summary?: Json | null
          metadata?: Json | null
          micro_trend_pattern?: string | null
          open?: number
          pattern_confidence?: number | null
          predominant_direction?: string | null
          symbol?: string
          tactical_insight?: string | null
          timeframe?: string
          timestamp?: string
          total_volume?: number
          trend_strength?: number | null
          true_signals_count?: number | null
        }
        Relationships: []
      }
      narrator_feedback: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          rating: number | null
          signal_id: string | null
          user_id: string | null
          was_accurate: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          signal_id?: string | null
          user_id?: string | null
          was_accurate?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          signal_id?: string | null
          user_id?: string | null
          was_accurate?: boolean | null
        }
        Relationships: []
      }
      narrator_signals: {
        Row: {
          created_at: string
          figure: string | null
          id: string
          market_status: string | null
          metadata: Json | null
          news: string | null
          pattern: string
          price: string
          probability: number
          risk_note: string | null
          signal_type: string
          symbol: string
          timeframe: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          figure?: string | null
          id?: string
          market_status?: string | null
          metadata?: Json | null
          news?: string | null
          pattern: string
          price: string
          probability: number
          risk_note?: string | null
          signal_type: string
          symbol: string
          timeframe: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          figure?: string | null
          id?: string
          market_status?: string | null
          metadata?: Json | null
          news?: string | null
          pattern?: string
          price?: string
          probability?: number
          risk_note?: string | null
          signal_type?: string
          symbol?: string
          timeframe?: string
          user_id?: string | null
        }
        Relationships: []
      }
      paper_trades: {
        Row: {
          created_at: string | null
          entry_price: number
          entry_time: string | null
          exit_price: number | null
          exit_time: string | null
          id: string
          lessons_learned: string | null
          metadata: Json | null
          notes: string | null
          pnl: number | null
          pnl_percent: number | null
          quantity: number
          side: string
          status: string | null
          stop_loss: number | null
          strategy_used: string | null
          symbol: string
          take_profit: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entry_price: number
          entry_time?: string | null
          exit_price?: number | null
          exit_time?: string | null
          id?: string
          lessons_learned?: string | null
          metadata?: Json | null
          notes?: string | null
          pnl?: number | null
          pnl_percent?: number | null
          quantity: number
          side: string
          status?: string | null
          stop_loss?: number | null
          strategy_used?: string | null
          symbol: string
          take_profit?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entry_price?: number
          entry_time?: string | null
          exit_price?: number | null
          exit_time?: string | null
          id?: string
          lessons_learned?: string | null
          metadata?: Json | null
          notes?: string | null
          pnl?: number | null
          pnl_percent?: number | null
          quantity?: number
          side?: string
          status?: string | null
          stop_loss?: number | null
          strategy_used?: string | null
          symbol?: string
          take_profit?: number | null
          user_id?: string
        }
        Relationships: []
      }
      pattern_memory: {
        Row: {
          avg_probability: number
          confidence_level: number
          created_at: string
          id: string
          last_updated: string
          market_conditions: string[]
          metadata: Json | null
          pattern_signature: string
          semantic_summary: string | null
          success_rate: number
          timeframes: string[]
          total_occurrences: number
        }
        Insert: {
          avg_probability?: number
          confidence_level?: number
          created_at?: string
          id?: string
          last_updated?: string
          market_conditions?: string[]
          metadata?: Json | null
          pattern_signature: string
          semantic_summary?: string | null
          success_rate?: number
          timeframes?: string[]
          total_occurrences?: number
        }
        Update: {
          avg_probability?: number
          confidence_level?: number
          created_at?: string
          id?: string
          last_updated?: string
          market_conditions?: string[]
          metadata?: Json | null
          pattern_signature?: string
          semantic_summary?: string | null
          success_rate?: number
          timeframes?: string[]
          total_occurrences?: number
        }
        Relationships: []
      }
      proactive_alerts: {
        Row: {
          acknowledged: boolean | null
          alert_type: string
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          trigger_condition: Json
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          alert_type: string
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          trigger_condition: Json
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          alert_type?: string
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          trigger_condition?: Json
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      processed_documents: {
        Row: {
          created_at: string | null
          error_message: string | null
          extracted_entries: number | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          processed_at: string | null
          status: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          extracted_entries?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          extracted_entries?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      signal_results: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          entry_price: number
          entry_time: string
          exit_price: number | null
          exit_time: string | null
          feature_id: string | null
          feedback_score: number | null
          id: string
          metadata: Json | null
          pnl: number | null
          pnl_percent: number | null
          signal_type: string
          status: string | null
          stop_loss: number | null
          take_profit: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          entry_price: number
          entry_time: string
          exit_price?: number | null
          exit_time?: string | null
          feature_id?: string | null
          feedback_score?: number | null
          id?: string
          metadata?: Json | null
          pnl?: number | null
          pnl_percent?: number | null
          signal_type: string
          status?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          entry_price?: number
          entry_time?: string
          exit_price?: number | null
          exit_time?: string | null
          feature_id?: string | null
          feedback_score?: number | null
          id?: string
          metadata?: Json | null
          pnl?: number | null
          pnl_percent?: number | null
          signal_type?: string
          status?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_results_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "market_features"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          areas_to_review: Json | null
          concepts_mastered: Json | null
          conversation_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          key_learnings: Json | null
          metadata: Json | null
          questions_asked: number | null
          satisfaction_score: number | null
          topic: string
          user_id: string
        }
        Insert: {
          areas_to_review?: Json | null
          concepts_mastered?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          key_learnings?: Json | null
          metadata?: Json | null
          questions_asked?: number | null
          satisfaction_score?: number | null
          topic: string
          user_id: string
        }
        Update: {
          areas_to_review?: Json | null
          concepts_mastered?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          key_learnings?: Json | null
          metadata?: Json | null
          questions_asked?: number | null
          satisfaction_score?: number | null
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      temporal_learning_history: {
        Row: {
          accuracy_feedback: number | null
          consolidated_trend: string | null
          created_at: string | null
          final_decision: string | null
          id: string
          metadata: Json | null
          patterns_detected: Json | null
          price: number
          symbol: string
          timestamp: string
          trend_m1: string | null
          trend_m15: string | null
          trend_m30: string | null
          trend_m5: string | null
          trend_score: number | null
          volume_profile: Json | null
        }
        Insert: {
          accuracy_feedback?: number | null
          consolidated_trend?: string | null
          created_at?: string | null
          final_decision?: string | null
          id?: string
          metadata?: Json | null
          patterns_detected?: Json | null
          price: number
          symbol: string
          timestamp: string
          trend_m1?: string | null
          trend_m15?: string | null
          trend_m30?: string | null
          trend_m5?: string | null
          trend_score?: number | null
          volume_profile?: Json | null
        }
        Update: {
          accuracy_feedback?: number | null
          consolidated_trend?: string | null
          created_at?: string | null
          final_decision?: string | null
          id?: string
          metadata?: Json | null
          patterns_detected?: Json | null
          price?: number
          symbol?: string
          timestamp?: string
          trend_m1?: string | null
          trend_m15?: string | null
          trend_m30?: string | null
          trend_m5?: string | null
          trend_score?: number | null
          volume_profile?: Json | null
        }
        Relationships: []
      }
      timeframe_performance: {
        Row: {
          accuracy_rate: number | null
          anticipation_score: number | null
          avg_confidence: number | null
          correct_signals: number | null
          created_at: string | null
          id: string
          last_evaluation: string | null
          metadata: Json | null
          pattern: string
          symbol: string
          timeframe: string
          total_signals: number | null
        }
        Insert: {
          accuracy_rate?: number | null
          anticipation_score?: number | null
          avg_confidence?: number | null
          correct_signals?: number | null
          created_at?: string | null
          id?: string
          last_evaluation?: string | null
          metadata?: Json | null
          pattern: string
          symbol: string
          timeframe: string
          total_signals?: number | null
        }
        Update: {
          accuracy_rate?: number | null
          anticipation_score?: number | null
          avg_confidence?: number | null
          correct_signals?: number | null
          created_at?: string | null
          id?: string
          last_evaluation?: string | null
          metadata?: Json | null
          pattern?: string
          symbol?: string
          timeframe?: string
          total_signals?: number | null
        }
        Relationships: []
      }
      trade_analysis: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          created_at: string | null
          entry_price: number | null
          feedback_score: number | null
          id: string
          market_context: Json | null
          pattern_detected: string | null
          probability: number | null
          result: string | null
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          timeframe: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_type: string
          confidence_score?: number | null
          created_at?: string | null
          entry_price?: number | null
          feedback_score?: number | null
          id?: string
          market_context?: Json | null
          pattern_detected?: string | null
          probability?: number | null
          result?: string | null
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          timeframe: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string | null
          entry_price?: number | null
          feedback_score?: number | null
          id?: string
          market_context?: Json | null
          pattern_detected?: string | null
          probability?: number | null
          result?: string | null
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          timeframe?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trade_simulations: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          entry_price: number
          expected_gain_percent: number | null
          id: string
          market_conditions: Json | null
          outcome: string | null
          risk_percent: number | null
          scenario_type: string
          session_id: string
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          entry_price: number
          expected_gain_percent?: number | null
          id?: string
          market_conditions?: Json | null
          outcome?: string | null
          risk_percent?: number | null
          scenario_type: string
          session_id: string
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          entry_price?: number
          expected_gain_percent?: number | null
          id?: string
          market_conditions?: Json | null
          outcome?: string | null
          risk_percent?: number | null
          scenario_type?: string
          session_id?: string
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          user_id?: string
        }
        Relationships: []
      }
      tradevision_feedback: {
        Row: {
          accuracy_weight: number | null
          actual_result: string | null
          confidence_score: number | null
          created_at: string | null
          evaluated_at: string | null
          expected_result: string
          id: string
          metadata: Json | null
          pattern: string
          signal_id: string | null
          signal_type: string
          timeframe: string
        }
        Insert: {
          accuracy_weight?: number | null
          actual_result?: string | null
          confidence_score?: number | null
          created_at?: string | null
          evaluated_at?: string | null
          expected_result: string
          id?: string
          metadata?: Json | null
          pattern: string
          signal_id?: string | null
          signal_type: string
          timeframe: string
        }
        Update: {
          accuracy_weight?: number | null
          actual_result?: string | null
          confidence_score?: number | null
          created_at?: string | null
          evaluated_at?: string | null
          expected_result?: string
          id?: string
          metadata?: Json | null
          pattern?: string
          signal_id?: string | null
          signal_type?: string
          timeframe?: string
        }
        Relationships: [
          {
            foreignKeyName: "tradevision_feedback_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "narrator_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      tradevision_state: {
        Row: {
          avg_accuracy: number | null
          created_at: string | null
          dominant_pattern: string | null
          id: string
          last_trend_change: string | null
          last_volume_profile: Json | null
          market_bias: string | null
          pattern_weights: Json | null
          session_insights: string | null
          symbol: string
          timeframe_accuracy: Json | null
          trend_duration: Json | null
          updated_at: string | null
          user_style: string | null
        }
        Insert: {
          avg_accuracy?: number | null
          created_at?: string | null
          dominant_pattern?: string | null
          id?: string
          last_trend_change?: string | null
          last_volume_profile?: Json | null
          market_bias?: string | null
          pattern_weights?: Json | null
          session_insights?: string | null
          symbol: string
          timeframe_accuracy?: Json | null
          trend_duration?: Json | null
          updated_at?: string | null
          user_style?: string | null
        }
        Update: {
          avg_accuracy?: number | null
          created_at?: string | null
          dominant_pattern?: string | null
          id?: string
          last_trend_change?: string | null
          last_volume_profile?: Json | null
          market_bias?: string | null
          pattern_weights?: Json | null
          session_insights?: string | null
          symbol?: string
          timeframe_accuracy?: Json | null
          trend_duration?: Json | null
          updated_at?: string | null
          user_style?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_trading_profiles: {
        Row: {
          alert_preferences: Json | null
          created_at: string | null
          experience_level: string | null
          id: string
          learning_goals: Json | null
          mentor_detail_level: string | null
          performance_stats: Json | null
          preferred_timeframes: string[] | null
          risk_level: string | null
          strengths: Json | null
          trading_style: string | null
          updated_at: string | null
          user_id: string
          weaknesses: Json | null
        }
        Insert: {
          alert_preferences?: Json | null
          created_at?: string | null
          experience_level?: string | null
          id?: string
          learning_goals?: Json | null
          mentor_detail_level?: string | null
          performance_stats?: Json | null
          preferred_timeframes?: string[] | null
          risk_level?: string | null
          strengths?: Json | null
          trading_style?: string | null
          updated_at?: string | null
          user_id: string
          weaknesses?: Json | null
        }
        Update: {
          alert_preferences?: Json | null
          created_at?: string | null
          experience_level?: string | null
          id?: string
          learning_goals?: Json | null
          mentor_detail_level?: string | null
          performance_stats?: Json | null
          preferred_timeframes?: string[] | null
          risk_level?: string | null
          strengths?: Json | null
          trading_style?: string | null
          updated_at?: string | null
          user_id?: string
          weaknesses?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_consolidated_trend_score: {
        Args: {
          m1_trend: string
          m15_trend: string
          m30_trend: string
          m5_trend: string
        }
        Returns: number
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_knowledge_usage: {
        Args: { knowledge_id: string }
        Returns: undefined
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_messages: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
          user_id_filter?: string
        }
        Returns: {
          content: string
          created_at: string
          feedback_score: number
          id: string
          metadata: Json
          role: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_pattern_learning: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_pattern_weights: {
        Args: { p_symbol: string }
        Returns: undefined
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "premium"],
    },
  },
} as const
