'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Utensils, Plus, Edit, Trash2, Search, Clock } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

type Food = Database['public']['Tables']['foods']['Row']
type MealTemplate = Database['public']['Tables']['meal_templates']['Row'] & {
  items: Array<MealTemplateItem>
}
type MealTemplateItem = Database['public']['Tables']['meal_template_items']['Row'] & {
  food: Food
}

const supabaseClient = createClientComponentClient<Database>()

export default function ComidasPage() {
  const [user, setUser] = useState<any>(null)
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [showCreateFood, setShowCreateFood] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MealTemplate | null>(null)
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    items: [] as Array<{
      food_id: string
      qty_units: number
      time_hint: string
    }>
  })

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabaseClient.auth.getUser()
      setUser(currentUser)
    }
    fetchUser()
  }, [])

  const [foodData, setFoodData] = useState({
    name: '',
    kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    unit: '100g',
    grams_per_unit: 100
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      if (!user) return
      
      // Cargar templates del usuario
      const { data: templatesData } = await supabaseClient
        .from('meal_templates')
        .select(`
          *,
          items:meal_template_items(
            id,
            food_id,
            qty_units,
            time_hint,
            food:foods(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Cargar alimentos disponibles
      const { data: foodsData } = await supabaseClient
        .from('foods')
        .select('*')
        .order('name')

      setTemplates(templatesData || [])
      setFoods(foodsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async () => {
    try {
      if (!user) return
      
      // Asegurarnos de que el usuario existe en la tabla users
      const { data: existingUser, error: userCheckError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingUser) {
        const { error: insertUserError } = await supabaseClient
          .from('users')
          .insert([{
            id: user.id,
            email: user.email
          }])

        if (insertUserError) {
          console.error('Error creating user:', insertUserError)
          throw insertUserError
        }
      }
      
      const newTemplate: Database['public']['Tables']['meal_templates']['Insert'] = {
        user_id: user.id,
        name: templateData.name,
        description: templateData.description || null
      }

      // Crear template
      const { data: template, error: templateError } = await supabaseClient
        .from('meal_templates')
        .insert([newTemplate])
        .select()
        .single()

      if (templateError) throw templateError

      // Crear items del template
      if (template && templateData.items.length > 0) {
        const itemsToInsert: Database['public']['Tables']['meal_template_items']['Insert'][] = 
          templateData.items.map(item => ({
            template_id: template.id,
            food_id: item.food_id,
            qty_units: item.qty_units,
            time_hint: item.time_hint || null
          }))

        const { error: itemsError } = await supabaseClient
          .from('meal_template_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      setTemplateData({ name: '', description: '', items: [] })
      setShowCreateTemplate(false)
      loadData()
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  const updateTemplate = async () => {
    if (!editingTemplate) return

    try {
      const updateData: Database['public']['Tables']['meal_templates']['Update'] = {
        name: templateData.name,
        description: templateData.description || null
      }

      // Actualizar template
      const { error: templateError } = await supabaseClient
        .from('meal_templates')
        .update(updateData)
        .eq('id', editingTemplate.id)

      if (templateError) throw templateError

      // Eliminar items existentes
      await supabaseClient
        .from('meal_template_items')
        .delete()
        .eq('template_id', editingTemplate.id)

      // Crear nuevos items
      if (templateData.items.length > 0) {
        const itemsToInsert: Database['public']['Tables']['meal_template_items']['Insert'][] = 
          templateData.items.map(item => ({
            template_id: editingTemplate.id,
            food_id: item.food_id,
            qty_units: item.qty_units,
            time_hint: item.time_hint || null
          }))

        const { error: itemsError } = await supabaseClient
          .from('meal_template_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      setTemplateData({ name: '', description: '', items: [] })
      setEditingTemplate(null)
      loadData()
    } catch (error) {
      console.error('Error updating template:', error)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabaseClient
        .from('meal_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const createFood = async () => {
    try {
      if (!user) return

      const newFood: Database['public']['Tables']['foods']['Insert'] = {
        name: foodData.name,
        kcal: foodData.kcal,
        protein_g: foodData.protein_g,
        carbs_g: foodData.carbs_g,
        fat_g: foodData.fat_g,
        unit: foodData.unit,
        grams_per_unit: foodData.grams_per_unit
      }
      
      const { error } = await supabaseClient
        .from('foods')
        .insert([newFood])

      if (error) throw error

      setFoodData({ name: '', kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, unit: '100g', grams_per_unit: 100 })
      setShowCreateFood(false)
      loadData()
    } catch (error) {
      console.error('Error creating food:', error)
    }
  }

  const addItemToTemplate = () => {
    setTemplateData(prev => ({
      ...prev,
      items: [...prev.items, { food_id: '', qty_units: 1, time_hint: '' }]
    }))
  }

  const removeItemFromTemplate = (index: number) => {
    setTemplateData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItemInTemplate = (index: number, field: string, value: any) => {
    setTemplateData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando comidas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comidas</h1>
          <p className="text-muted-foreground">
            Gestiona tus templates de comidas y alimentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreateFood(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Alimento
          </Button>
          <Button onClick={() => setShowCreateTemplate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Template
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(template)
                      setTemplateData({
                        name: template.name,
                        description: template.description || '',
                        items: template.items.map(item => ({
                          food_id: item.food_id,
                          qty_units: item.qty_units,
                          time_hint: item.time_hint || ''
                        }))
                      })
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {template.description && (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-3 w-3 text-gray-400" />
                      <span>{item.food.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{item.qty_units} {item.food.unit}</span>
                      {item.time_hint && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{item.time_hint}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal para crear/editar template */}
      {(showCreateTemplate || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingTemplate ? 'Editar Template' : 'Nuevo Template'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del template</label>
                <Input
                  placeholder="Ej: Desayuno proteico"
                  value={templateData.name}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción (opcional)</label>
                <Input
                  placeholder="Ej: Desayuno alto en proteínas para días de entrenamiento"
                  value={templateData.description}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Alimentos</label>
                  <Button size="sm" onClick={addItemToTemplate}>
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar
                  </Button>
                </div>

                <div className="space-y-2">
                  {templateData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        className="flex-1 px-3 py-2 border rounded-md"
                        value={item.food_id}
                        onChange={(e) => updateItemInTemplate(index, 'food_id', e.target.value)}
                      >
                        <option value="">Seleccionar alimento</option>
                        {foods.map((food) => (
                          <option key={food.id} value={food.id}>
                            {food.name} ({food.kcal} kcal/100g)
                          </option>
                        ))}
                      </select>
                      
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        value={item.qty_units}
                        onChange={(e) => updateItemInTemplate(index, 'qty_units', parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                      
                      <Input
                        placeholder="Hora (opcional)"
                        value={item.time_hint}
                        onChange={(e) => updateItemInTemplate(index, 'time_hint', e.target.value)}
                        className="w-24"
                      />
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeItemFromTemplate(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={editingTemplate ? updateTemplate : createTemplate}
                  disabled={!templateData.name || templateData.items.length === 0}
                  className="flex-1"
                >
                  {editingTemplate ? 'Actualizar' : 'Crear'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateTemplate(false)
                    setEditingTemplate(null)
                    setTemplateData({ name: '', description: '', items: [] })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para crear alimento */}
      {showCreateFood && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Nuevo Alimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del alimento</label>
                <Input
                  placeholder="Ej: Pollo pechuga"
                  value={foodData.name}
                  onChange={(e) => setFoodData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Calorías (kcal)</label>
                  <Input
                    type="number"
                    value={foodData.kcal}
                    onChange={(e) => setFoodData(prev => ({ ...prev, kcal: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proteína (g)</label>
                  <Input
                    type="number"
                    value={foodData.protein_g}
                    onChange={(e) => setFoodData(prev => ({ ...prev, protein_g: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Carbohidratos (g)</label>
                  <Input
                    type="number"
                    value={foodData.carbs_g}
                    onChange={(e) => setFoodData(prev => ({ ...prev, carbs_g: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Grasas (g)</label>
                  <Input
                    type="number"
                    value={foodData.fat_g}
                    onChange={(e) => setFoodData(prev => ({ ...prev, fat_g: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unidad</label>
                  <Input
                    placeholder="Ej: 100g, 1 unidad"
                    value={foodData.unit}
                    onChange={(e) => setFoodData(prev => ({ ...prev, unit: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gramos por unidad</label>
                  <Input
                    type="number"
                    value={foodData.grams_per_unit}
                    onChange={(e) => setFoodData(prev => ({ ...prev, grams_per_unit: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={createFood}
                  disabled={!foodData.name || foodData.kcal === 0}
                  className="flex-1"
                >
                  Crear
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateFood(false)
                    setFoodData({ name: '', kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, unit: '100g', grams_per_unit: 100 })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
