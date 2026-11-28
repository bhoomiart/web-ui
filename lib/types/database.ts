export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          diff: Json | null;
          id: string;
          record_id: string | null;
          table_name: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          diff?: Json | null;
          id?: string;
          record_id?: string | null;
          table_name?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          diff?: Json | null;
          id?: string;
          record_id?: string | null;
          table_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      banners: {
        Row: {
          cta_text: string | null;
          cta_url: string | null;
          display_order: number;
          id: string;
          image_url: string;
          is_active: boolean;
          subtitle: string | null;
          title: string | null;
        };
        Insert: {
          cta_text?: string | null;
          cta_url?: string | null;
          display_order?: number;
          id?: string;
          image_url: string;
          is_active?: boolean;
          subtitle?: string | null;
          title?: string | null;
        };
        Update: {
          cta_text?: string | null;
          cta_url?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string;
          is_active?: boolean;
          subtitle?: string | null;
          title?: string | null;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          body: string | null;
          id: string;
          published_at: string | null;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          status: string;
          title: string;
        };
        Insert: {
          body?: string | null;
          id?: string;
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          status?: string;
          title: string;
        };
        Update: {
          body?: string | null;
          id?: string;
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          status?: string;
          title?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          cart_id: string;
          created_at: string;
          id: string;
          product_id: string;
          quantity: number;
          updated_at: string;
          variant_id: string | null;
          variant_key: string | null;
        };
        Insert: {
          cart_id: string;
          created_at?: string;
          id?: string;
          product_id: string;
          quantity: number;
          updated_at?: string;
          variant_id?: string | null;
          variant_key?: string | null;
        };
        Update: {
          cart_id?: string;
          created_at?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
          updated_at?: string;
          variant_id?: string | null;
          variant_key?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cart_items_cart_id_fkey';
            columns: ['cart_id'];
            isOneToOne: false;
            referencedRelation: 'carts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      carts: {
        Row: {
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          image_url: string | null;
          is_visible: boolean;
          name: string;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          is_visible?: boolean;
          name: string;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          is_visible?: boolean;
          name?: string;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      collection_products: {
        Row: {
          collection_id: string;
          display_order: number;
          product_id: string;
        };
        Insert: {
          collection_id: string;
          display_order?: number;
          product_id: string;
        };
        Update: {
          collection_id?: string;
          display_order?: number;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_products_collection_id_fkey';
            columns: ['collection_id'];
            isOneToOne: false;
            referencedRelation: 'collections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collection_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      collections: {
        Row: {
          description: string | null;
          id: string;
          image_url: string | null;
          is_visible: boolean;
          name: string;
          slug: string;
          type: Database['public']['Enums']['collection_type'];
        };
        Insert: {
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_visible?: boolean;
          name: string;
          slug: string;
          type: Database['public']['Enums']['collection_type'];
        };
        Update: {
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_visible?: boolean;
          name?: string;
          slug?: string;
          type?: Database['public']['Enums']['collection_type'];
        };
        Relationships: [];
      };
      homepage_sections: {
        Row: {
          config: Json | null;
          display_order: number;
          id: string;
          is_visible: boolean;
          section_key: string;
          title: string | null;
        };
        Insert: {
          config?: Json | null;
          display_order?: number;
          id?: string;
          is_visible?: boolean;
          section_key: string;
          title?: string | null;
        };
        Update: {
          config?: Json | null;
          display_order?: number;
          id?: string;
          is_visible?: boolean;
          section_key?: string;
          title?: string | null;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          available_stock: number | null;
          id: string;
          low_stock_threshold: number;
          product_id: string;
          reserved_stock: number;
          total_stock: number;
          tracking_enabled: boolean;
          variant_id: string | null;
        };
        Insert: {
          available_stock?: number | null;
          id?: string;
          low_stock_threshold?: number;
          product_id: string;
          reserved_stock?: number;
          total_stock?: number;
          tracking_enabled?: boolean;
          variant_id?: string | null;
        };
        Update: {
          available_stock?: number | null;
          id?: string;
          low_stock_threshold?: number;
          product_id?: string;
          reserved_stock?: number;
          total_stock?: number;
          tracking_enabled?: boolean;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_movements: {
        Row: {
          actor_id: string | null;
          change_qty: number;
          change_type: Database['public']['Enums']['change_type'];
          created_at: string;
          id: string;
          inventory_id: string;
          new_qty: number;
          order_id: string | null;
          previous_qty: number;
          reason: string | null;
          return_id: string | null;
        };
        Insert: {
          actor_id?: string | null;
          change_qty: number;
          change_type: Database['public']['Enums']['change_type'];
          created_at?: string;
          id?: string;
          inventory_id: string;
          new_qty: number;
          order_id?: string | null;
          previous_qty: number;
          reason?: string | null;
          return_id?: string | null;
        };
        Update: {
          actor_id?: string | null;
          change_qty?: number;
          change_type?: Database['public']['Enums']['change_type'];
          created_at?: string;
          id?: string;
          inventory_id?: string;
          new_qty?: number;
          order_id?: string | null;
          previous_qty?: number;
          reason?: string | null;
          return_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_inventory_movements_order';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_inventory_movements_return';
            columns: ['return_id'];
            isOneToOne: false;
            referencedRelation: 'return_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_movements_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_movements_inventory_id_fkey';
            columns: ['inventory_id'];
            isOneToOne: false;
            referencedRelation: 'inventory';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          item_total: number;
          order_id: string;
          product_id: string;
          quantity: number;
          snapshot: Json;
          status: Database['public']['Enums']['order_status'];
          unit_price: number;
          variant_id: string | null;
        };
        Insert: {
          id?: string;
          item_total: number;
          order_id: string;
          product_id: string;
          quantity: number;
          status?: Database['public']['Enums']['order_status'];
          snapshot: Json;
          unit_price: number;
          variant_id?: string | null;
        };
        Update: {
          id?: string;
          item_total?: number;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          snapshot?: Json;
          status?: Database['public']['Enums']['order_status'];
          unit_price?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      order_status_history: {
        Row: {
          actor_id: string | null;
          created_at: string;
          id: string;
          new_status: string;
          notes: string | null;
          order_id: string;
          order_item_id: string | null;
          previous_status: string | null;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          new_status: string;
          notes?: string | null;
          order_id: string;
          order_item_id?: string | null;
          previous_status?: string | null;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          new_status?: string;
          notes?: string | null;
          order_id?: string;
          order_item_id?: string | null;
          previous_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'order_status_history_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_status_history_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          country: string;
          created_at: string;
          customer_name: string;
          customization: string | null;
          discount_amount: number;
          email: string | null;
          id: string;
          notes: string | null;
          order_number: string;
          payment_notes: string | null;
          payment_status: Database['public']['Enums']['payment_status'];
          phone: string;
          postal_code: string | null;
          shipping_fee: number;
          state: string | null;
          status: Database['public']['Enums']['order_status'];
          subtotal_amount: number | null;
          total_amount: number | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          customer_name: string;
          customization?: string | null;
          discount_amount?: number;
          email?: string | null;
          id?: string;
          notes?: string | null;
          order_number: string;
          payment_notes?: string | null;
          payment_status?: Database['public']['Enums']['payment_status'];
          phone: string;
          postal_code?: string | null;
          shipping_fee?: number;
          state?: string | null;
          status?: Database['public']['Enums']['order_status'];
          subtotal_amount?: number | null;
          total_amount?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          customer_name?: string;
          customization?: string | null;
          discount_amount?: number;
          email?: string | null;
          id?: string;
          notes?: string | null;
          order_number?: string;
          payment_notes?: string | null;
          payment_status?: Database['public']['Enums']['payment_status'];
          phone?: string;
          postal_code?: string | null;
          shipping_fee?: number;
          state?: string | null;
          status?: Database['public']['Enums']['order_status'];
          subtotal_amount?: number | null;
          total_amount?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      pages: {
        Row: {
          body: string | null;
          id: string;
          is_published: boolean;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          body?: string | null;
          id?: string;
          is_published?: boolean;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string | null;
          id?: string;
          is_published?: boolean;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_category_map: {
        Row: {
          category_id: string;
          product_id: string;
        };
        Insert: {
          category_id: string;
          product_id: string;
        };
        Update: {
          category_id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_category_map_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_category_map_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_media: {
        Row: {
          alt_text: string | null;
          display_order: number;
          id: string;
          media_type: Database['public']['Enums']['media_type'];
          product_id: string;
          url: string;
        };
        Insert: {
          alt_text?: string | null;
          display_order?: number;
          id?: string;
          media_type?: Database['public']['Enums']['media_type'];
          product_id: string;
          url: string;
        };
        Update: {
          alt_text?: string | null;
          display_order?: number;
          id?: string;
          media_type?: Database['public']['Enums']['media_type'];
          product_id?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_media_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_recommendations: {
        Row: {
          display_order: number;
          id: string;
          product_id: string;
          recommended_id: string;
          type: string;
        };
        Insert: {
          display_order?: number;
          id?: string;
          product_id: string;
          recommended_id: string;
          type: string;
        };
        Update: {
          display_order?: number;
          id?: string;
          product_id?: string;
          recommended_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_recommendations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_recommendations_recommended_id_fkey';
            columns: ['recommended_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_reviews: {
        Row: {
          admin_response: string | null;
          body: string | null;
          created_at: string;
          customer_name: string;
          id: string;
          is_verified_purchase: boolean;
          order_id: string | null;
          product_id: string;
          rating: number;
          status: Database['public']['Enums']['review_status'];
        };
        Insert: {
          admin_response?: string | null;
          body?: string | null;
          created_at?: string;
          customer_name: string;
          id?: string;
          is_verified_purchase?: boolean;
          order_id?: string | null;
          product_id: string;
          rating: number;
          status?: Database['public']['Enums']['review_status'];
        };
        Update: {
          admin_response?: string | null;
          body?: string | null;
          created_at?: string;
          customer_name?: string;
          id?: string;
          is_verified_purchase?: boolean;
          order_id?: string | null;
          product_id?: string;
          rating?: number;
          status?: Database['public']['Enums']['review_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'product_reviews_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_reviews_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_subcategory_map: {
        Row: {
          product_id: string;
          subcategory_id: string;
        };
        Insert: {
          product_id: string;
          subcategory_id: string;
        };
        Update: {
          product_id?: string;
          subcategory_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_subcategory_map_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_subcategory_map_subcategory_id_fkey';
            columns: ['subcategory_id'];
            isOneToOne: false;
            referencedRelation: 'subcategories';
            referencedColumns: ['id'];
          },
        ];
      };
      product_tag_map: {
        Row: {
          product_id: string;
          tag_id: string;
        };
        Insert: {
          product_id: string;
          tag_id: string;
        };
        Update: {
          product_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_tag_map_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_tag_map_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'product_tags';
            referencedColumns: ['id'];
          },
        ];
      };
      product_tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          attributes: Json | null;
          id: string;
          name: string;
          price_modifier: number;
          product_id: string;
          sku: string | null;
          status: string;
        };
        Insert: {
          attributes?: Json | null;
          id?: string;
          name: string;
          price_modifier?: number;
          product_id: string;
          sku?: string | null;
          status?: string;
        };
        Update: {
          attributes?: Json | null;
          id?: string;
          name?: string;
          price_modifier?: number;
          product_id?: string;
          sku?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          availability_type: Database['public']['Enums']['availability_type'];
          canonical_url: string | null;
          care_instructions: string | null;
          created_at: string;
          dimensions: Json | null;
          id: string;
          is_bestseller: boolean;
          is_featured: boolean;
          is_new_arrival: boolean;
          is_signature: boolean;
          long_description: string | null;
          materials: string | null;
          name: string;
          og_image_url: string | null;
          preparation_time: string | null;
          price: number | null;
          seo_description: string | null;
          seo_slug: string | null;
          seo_title: string | null;
          short_description: string | null;
          sku: string | null;
          slug: string;
          specifications: Json | null;
          status: Database['public']['Enums']['product_status'];
          story_content: string | null;
          updated_at: string;
        };
        Insert: {
          availability_type?: Database['public']['Enums']['availability_type'];
          canonical_url?: string | null;
          care_instructions?: string | null;
          created_at?: string;
          dimensions?: Json | null;
          id?: string;
          is_bestseller?: boolean;
          is_featured?: boolean;
          is_new_arrival?: boolean;
          is_signature?: boolean;
          long_description?: string | null;
          materials?: string | null;
          name: string;
          og_image_url?: string | null;
          preparation_time?: string | null;
          price?: number | null;
          seo_description?: string | null;
          seo_slug?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          sku?: string | null;
          slug: string;
          specifications?: Json | null;
          status?: Database['public']['Enums']['product_status'];
          story_content?: string | null;
          updated_at?: string;
        };
        Update: {
          availability_type?: Database['public']['Enums']['availability_type'];
          canonical_url?: string | null;
          care_instructions?: string | null;
          created_at?: string;
          dimensions?: Json | null;
          id?: string;
          is_bestseller?: boolean;
          is_featured?: boolean;
          is_new_arrival?: boolean;
          is_signature?: boolean;
          long_description?: string | null;
          materials?: string | null;
          name?: string;
          og_image_url?: string | null;
          preparation_time?: string | null;
          price?: number | null;
          seo_description?: string | null;
          seo_slug?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          sku?: string | null;
          slug?: string;
          specifications?: Json | null;
          status?: Database['public']['Enums']['product_status'];
          story_content?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: Database['public']['Enums']['user_role'];
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
        };
        Relationships: [];
      };
      refund_status_history: {
        Row: {
          actor_id: string | null;
          created_at: string;
          id: string;
          new_status: string;
          notes: string | null;
          previous_status: string | null;
          refund_id: string;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          new_status: string;
          notes?: string | null;
          previous_status?: string | null;
          refund_id: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          new_status?: string;
          notes?: string | null;
          previous_status?: string | null;
          refund_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'refund_status_history_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'refund_status_history_refund_id_fkey';
            columns: ['refund_id'];
            isOneToOne: false;
            referencedRelation: 'refunds';
            referencedColumns: ['id'];
          },
        ];
      };
      refunds: {
        Row: {
          actor_id: string;
          amount: number;
          id: string;
          method: string;
          notes: string | null;
          order_id: string;
          processed_at: string | null;
          reference_id: string | null;
          refund_type: Database['public']['Enums']['refund_type'];
          return_request_id: string | null;
        };
        Insert: {
          actor_id: string;
          amount: number;
          id?: string;
          method: string;
          notes?: string | null;
          order_id: string;
          processed_at?: string | null;
          reference_id?: string | null;
          refund_type: Database['public']['Enums']['refund_type'];
          return_request_id?: string | null;
        };
        Update: {
          actor_id?: string;
          amount?: number;
          id?: string;
          method?: string;
          notes?: string | null;
          order_id?: string;
          processed_at?: string | null;
          reference_id?: string | null;
          refund_type?: Database['public']['Enums']['refund_type'];
          return_request_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'refunds_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'refunds_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'refunds_return_request_id_fkey';
            columns: ['return_request_id'];
            isOneToOne: false;
            referencedRelation: 'return_requests';
            referencedColumns: ['id'];
          },
        ];
      };
      restock_notification_history: {
        Row: {
          attempt_at: string;
          id: string;
          inventory_id: string;
          provider_response: string | null;
          status: Database['public']['Enums']['notification_status'];
          subscription_id: string;
        };
        Insert: {
          attempt_at?: string;
          id?: string;
          inventory_id: string;
          provider_response?: string | null;
          status?: Database['public']['Enums']['notification_status'];
          subscription_id: string;
        };
        Update: {
          attempt_at?: string;
          id?: string;
          inventory_id?: string;
          provider_response?: string | null;
          status?: Database['public']['Enums']['notification_status'];
          subscription_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'restock_notification_history_inventory_id_fkey';
            columns: ['inventory_id'];
            isOneToOne: false;
            referencedRelation: 'inventory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'restock_notification_history_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'restock_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      restock_subscriptions: {
        Row: {
          channel: Database['public']['Enums']['notification_channel'];
          email: string | null;
          id: string;
          phone: string | null;
          product_id: string;
          status: Database['public']['Enums']['subscription_status'];
          subscribed_at: string;
          variant_id: string | null;
        };
        Insert: {
          channel?: Database['public']['Enums']['notification_channel'];
          email?: string | null;
          id?: string;
          phone?: string | null;
          product_id: string;
          status?: Database['public']['Enums']['subscription_status'];
          subscribed_at?: string;
          variant_id?: string | null;
        };
        Update: {
          channel?: Database['public']['Enums']['notification_channel'];
          email?: string | null;
          id?: string;
          phone?: string | null;
          product_id?: string;
          status?: Database['public']['Enums']['subscription_status'];
          subscribed_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'restock_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'restock_subscriptions_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      return_request_items: {
        Row: {
          id: string;
          image_urls: string[];
          order_item_id: string;
          quantity: number;
          return_request_id: string;
        };
        Insert: {
          id?: string;
          image_urls?: string[];
          order_item_id: string;
          quantity: number;
          return_request_id: string;
        };
        Update: {
          id?: string;
          image_urls?: string[];
          order_item_id?: string;
          quantity?: number;
          return_request_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'return_request_items_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'return_request_items_return_request_id_fkey';
            columns: ['return_request_id'];
            isOneToOne: false;
            referencedRelation: 'return_requests';
            referencedColumns: ['id'];
          },
        ];
      };
      return_requests: {
        Row: {
          admin_notes: string | null;
          created_at: string;
          description: string | null;
          id: string;
          order_id: string;
          reason: Database['public']['Enums']['return_reason'];
          status: Database['public']['Enums']['return_status'];
          updated_at: string;
        };
        Insert: {
          admin_notes?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          order_id: string;
          reason: Database['public']['Enums']['return_reason'];
          status?: Database['public']['Enums']['return_status'];
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          order_id?: string;
          reason?: Database['public']['Enums']['return_reason'];
          status?: Database['public']['Enums']['return_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'return_requests_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      review_media: {
        Row: {
          alt_text: string | null;
          id: string;
          review_id: string;
          url: string;
        };
        Insert: {
          alt_text?: string | null;
          id?: string;
          review_id: string;
          url: string;
        };
        Update: {
          alt_text?: string | null;
          id?: string;
          review_id?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_media_review_id_fkey';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'product_reviews';
            referencedColumns: ['id'];
          },
        ];
      };
      shipping_rates: {
        Row: {
          fee: number;
          free_above: number | null;
          is_active: boolean;
          state: string;
          updated_at: string;
        };
        Insert: {
          fee: number;
          free_above?: number | null;
          is_active?: boolean;
          state: string;
          updated_at?: string;
        };
        Update: {
          fee?: number;
          free_above?: number | null;
          is_active?: boolean;
          state?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          description: string | null;
          key: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          description?: string | null;
          key: string;
          updated_at?: string;
          value?: string;
        };
        Update: {
          description?: string | null;
          key?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      subcategories: {
        Row: {
          category_id: string;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          image_url: string | null;
          is_visible: boolean;
          name: string;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          is_visible?: boolean;
          name: string;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          is_visible?: boolean;
          name?: string;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subcategories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      adjust_stock_manual: {
        Args: {
          p_actor_id: string;
          p_change_qty: number;
          p_change_type: Database['public']['Enums']['change_type'];
          p_inventory_id: string;
          p_reason: string;
        };
        Returns: undefined;
      };
      create_order_with_stock: {
        Args: { p_clear_cart_for?: string; p_items: Json; p_order: Json };
        Returns: Json;
      };
      is_admin: { Args: never; Returns: boolean };
      is_admin_or_staff: { Args: never; Returns: boolean };
      reserve_stock_for_order: { Args: { p_items: Json }; Returns: undefined };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
    };
    Enums: {
      availability_type: 'ready_to_ship' | 'made_to_order' | 'out_of_stock';
      change_type:
        | 'restock'
        | 'production'
        | 'damaged'
        | 'manual_correction'
        | 'order_reserved'
        | 'order_released'
        | 'order_fulfilled'
        | 'return_restocked';
      collection_type:
        | 'signature'
        | 'bestsellers'
        | 'new_arrivals'
        | 'featured'
        | 'trending'
        | 'customized'
        | 'special';
      media_type: 'image' | 'video';
      notification_channel: 'whatsapp' | 'email' | 'both';
      notification_status: 'pending' | 'sent' | 'failed';
      order_status:
        | 'pending'
        | 'confirmed'
        | 'processing'
        | 'customization_in_progress'
        | 'ready_for_dispatch'
        | 'shipped'
        | 'delivered'
        | 'cancellation_requested'
        | 'cancelled'
        | 'return_requested'
        | 'return_approved'
        | 'return_rejected'
        | 'return_in_transit'
        | 'returned'
        | 'refund_requested'
        | 'refund_under_review'
        | 'refund_approved'
        | 'refund_processing'
        | 'partially_refunded'
        | 'refunded'
        | 'refund_rejected';
      payment_status: 'pending' | 'received' | 'failed';
      product_status: 'active' | 'archived' | 'draft';
      refund_type: 'full' | 'partial';
      return_reason: 'damaged' | 'wrong_item' | 'changed_mind' | 'quality_issue' | 'other';
      return_status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed' | 'cancelled';
      review_status: 'pending' | 'approved' | 'rejected' | 'hidden';
      subscription_status: 'active' | 'notified' | 'unsubscribed';
      user_role: 'admin' | 'staff' | 'customer';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      availability_type: ['ready_to_ship', 'made_to_order', 'out_of_stock'],
      change_type: [
        'restock',
        'production',
        'damaged',
        'manual_correction',
        'order_reserved',
        'order_released',
        'order_fulfilled',
        'return_restocked',
      ],
      collection_type: [
        'signature',
        'bestsellers',
        'new_arrivals',
        'featured',
        'trending',
        'customized',
        'special',
      ],
      media_type: ['image', 'video'],
      notification_channel: ['whatsapp', 'email', 'both'],
      notification_status: ['pending', 'sent', 'failed'],
      order_status: [
        'pending',
        'confirmed',
        'processing',
        'customization_in_progress',
        'ready_for_dispatch',
        'shipped',
        'delivered',
        'cancellation_requested',
        'cancelled',
        'return_requested',
        'return_approved',
        'return_rejected',
        'return_in_transit',
        'returned',
        'refund_requested',
        'refund_under_review',
        'refund_approved',
        'refund_processing',
        'partially_refunded',
        'refunded',
        'refund_rejected',
      ],
      payment_status: ['pending', 'received', 'failed'],
      product_status: ['active', 'archived', 'draft'],
      refund_type: ['full', 'partial'],
      return_reason: ['damaged', 'wrong_item', 'changed_mind', 'quality_issue', 'other'],
      return_status: ['pending', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled'],
      review_status: ['pending', 'approved', 'rejected', 'hidden'],
      subscription_status: ['active', 'notified', 'unsubscribed'],
      user_role: ['admin', 'staff', 'customer'],
    },
  },
} as const;
