import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { DeployedObject } from '@/types/database';

export function useDatabase() {
  const [objects, setObjects] = useState<DeployedObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllObjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('deployed_objects')
        .select(`
          id,
          name,
          description,
          latitude,
          longitude,
          altitude,
          object_type,
          user_id,
          model_url,
          model_type,
          scale_x,
          scale_y,
          scale_z,
          rotation_x,
          rotation_y,
          rotation_z,
          visibility_radius,
          is_active,
          created_at,
          preciselatitude,
          preciselongitude,
          precisealtitude,
          accuracy,
          correctionapplied
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Database query error:', fetchError.message);
        throw new Error(`Query failed: ${fetchError.message}`);
      }

      if (data) {
        setObjects(data);
        console.log('✅ Fetched objects:', data.length);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Fetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addObject = async (objectData: Omit<DeployedObject, 'id' | 'created_at'>) => {
    try {
      setError(null);
      
      const { data, error: insertError } = await supabase
        .from('deployed_objects')
        .insert([objectData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert error:', insertError.message);
        throw new Error(`Insert failed: ${insertError.message}`);
      }

      if (data) {
        setObjects(prev => [data, ...prev]);
        console.log('✅ Added object:', data.id);
        return data;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Add object error:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  const updateObject = async (id: string, updates: Partial<DeployedObject>) => {
    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('deployed_objects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Update error:', updateError.message);
        throw new Error(`Update failed: ${updateError.message}`);
      }

      if (data) {
        setObjects(prev => prev.map(obj => obj.id === id ? data : obj));
        console.log('✅ Updated object:', id);
        return data;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Update object error:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  const deleteObject = async (id: string) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('deployed_objects')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ Delete error:', deleteError.message);
        throw new Error(`Delete failed: ${deleteError.message}`);
      }

      setObjects(prev => prev.filter(obj => obj.id !== id));
      console.log('✅ Deleted object:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Delete object error:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchAllObjects();
  }, []);

  return {
    objects,
    loading,
    error,
    fetchAllObjects,
    addObject,
    updateObject,
    deleteObject,
  };
}