import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  MapPin, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
} from 'lucide-react';

interface NetworkNode {
  id: string;
  name: string;
  type: 'farm' | 'collection_center' | 'processing_plant' | 'distributor' | 'retail';
  lat: number;
  lng: number;
  capacity: number;
  production?: number;
  district: string;
  contact?: string;
  phone?: string;
  isVisible: boolean;
  isCustom?: boolean;
}

interface NodeManagementProps {
  nodes: NetworkNode[];
  onNodesChange: (nodes: NetworkNode[]) => void;
  onNodeVisibilityToggle: (nodeId: string) => void;
}

const NODE_TYPES = [
  { value: 'farm', label: 'Dairy Farm', icon: '🐄', color: 'bg-green-100 text-green-800' },
  { value: 'collection_center', label: 'Collection Center', icon: '🏭', color: 'bg-blue-100 text-blue-800' },
  { value: 'processing_plant', label: 'Processing Plant', icon: '⚙️', color: 'bg-purple-100 text-purple-800' },
  { value: 'distributor', label: 'Distributor', icon: '📦', color: 'bg-orange-100 text-orange-800' },
  { value: 'retail', label: 'Retail Outlet', icon: '🏪', color: 'bg-red-100 text-red-800' }
];

export function NodeManagement({ nodes, onNodesChange, onNodeVisibilityToggle }: NodeManagementProps) {
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [editingNode, setEditingNode] = useState<NetworkNode | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    lat: '',
    lng: '',
    capacity: '',
    production: '',
    district: '',
    contact: '',
    phone: ''
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      lat: '',
      lng: '',
      capacity: '',
      production: '',
      district: '',
      contact: '',
      phone: ''
    });
    setIsAddingNode(false);
    setEditingNode(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Node name is required", variant: "destructive" });
      return false;
    }
    if (!formData.type) {
      toast({ title: "Error", description: "Node type is required", variant: "destructive" });
      return false;
    }
    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: "Error", description: "Valid coordinates are required", variant: "destructive" });
      return false;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({ title: "Error", description: "Coordinates must be valid (lat: -90 to 90, lng: -180 to 180)", variant: "destructive" });
      return false;
    }
    const capacity = parseInt(formData.capacity);
    if (isNaN(capacity) || capacity <= 0) {
      toast({ title: "Error", description: "Valid capacity is required", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleAddNode = () => {
    if (!validateForm()) return;

    const newNode: NetworkNode = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      type: formData.type as NetworkNode['type'],
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      capacity: parseInt(formData.capacity),
      production: formData.production ? parseInt(formData.production) : undefined,
      district: formData.district.trim() || 'Unknown',
      contact: formData.contact.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      isVisible: true,
      isCustom: true
    };

    onNodesChange([...nodes, newNode]);
    resetForm();
    
    toast({
      title: "Node Added",
      description: `${newNode.name} has been successfully added to the network`,
    });
  };

  const handleEditNode = (node: NetworkNode) => {
    setEditingNode(node);
    setFormData({
      name: node.name,
      type: node.type,
      lat: node.lat.toString(),
      lng: node.lng.toString(),
      capacity: node.capacity.toString(),
      production: node.production?.toString() || '',
      district: node.district,
      contact: node.contact || '',
      phone: node.phone || ''
    });
    setIsAddingNode(true);
  };

  const handleUpdateNode = () => {
    if (!validateForm() || !editingNode) return;

    const updatedNode: NetworkNode = {
      ...editingNode,
      name: formData.name.trim(),
      type: formData.type as NetworkNode['type'],
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      capacity: parseInt(formData.capacity),
      production: formData.production ? parseInt(formData.production) : undefined,
      district: formData.district.trim() || 'Unknown',
      contact: formData.contact.trim() || undefined,
      phone: formData.phone.trim() || undefined,
    };

    const updatedNodes = nodes.map(node => 
      node.id === editingNode.id ? updatedNode : node
    );
    
    onNodesChange(updatedNodes);
    resetForm();
    
    toast({
      title: "Node Updated",
      description: `${updatedNode.name} has been successfully updated`,
    });
  };

  const handleDeleteNode = (nodeId: string) => {
    const nodeToDelete = nodes.find(n => n.id === nodeId);
    if (!nodeToDelete?.isCustom) {
      toast({
        title: "Cannot Delete",
        description: "Only custom nodes can be deleted",
        variant: "destructive"
      });
      return;
    }

    const updatedNodes = nodes.filter(node => node.id !== nodeId);
    onNodesChange(updatedNodes);
    
    toast({
      title: "Node Deleted",
      description: `${nodeToDelete.name} has been removed from the network`,
    });
  };

  const getNodeTypeInfo = (type: string) => {
    return NODE_TYPES.find(t => t.value === type) || NODE_TYPES[0];
  };

  const visibleNodes = nodes.filter(n => n.isVisible);
  const hiddenNodes = nodes.filter(n => !n.isVisible);

  return (
    <div className="space-y-6">
      {/* Add/Edit Node Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingNode ? 'Edit Network Node' : 'Add New Network Node'}
          </CardTitle>
          <CardDescription>
            {editingNode ? 'Modify existing node properties' : 'Add a new facility to your dairy supply chain network'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAddingNode ? (
            <Button onClick={() => setIsAddingNode(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add New Node
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Facility Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter facility name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Facility Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select facility type" />
                    </SelectTrigger>
                    <SelectContent>
                      {NODE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lat">Latitude *</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                    placeholder="12.9716 (Bangalore)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lng">Longitude *</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                    placeholder="77.5946 (Bangalore)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacity (Liters) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    placeholder="10000"
                  />
                </div>
                
                <div>
                  <Label htmlFor="production">Daily Production (Liters)</Label>
                  <Input
                    id="production"
                    type="number"
                    value={formData.production}
                    onChange={(e) => setFormData(prev => ({ ...prev, production: e.target.value }))}
                    placeholder="5000 (for farms)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                    placeholder="Bangalore Urban"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact">Contact Person</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91-9876543210"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={editingNode ? handleUpdateNode : handleAddNode} 
                  className="flex-1"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {editingNode ? 'Update Node' : 'Add Node'}
                </Button>
                <Button onClick={resetForm} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Node Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {NODE_TYPES.map(type => {
          const count = nodes.filter(n => n.type === type.value).length;
          return (
            <Card key={type.value}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">{type.label}s</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Nodes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Network Nodes ({nodes.length} total)
            </div>
            <div className="flex gap-2 text-sm">
              <Badge variant="default">{visibleNodes.length} visible</Badge>
              <Badge variant="secondary">{hiddenNodes.length} hidden</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodes.map((node) => {
                  const typeInfo = getNodeTypeInfo(node.type);
                  return (
                    <TableRow key={node.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{typeInfo.icon}</span>
                          {node.name}
                          {node.isCustom && <Badge variant="outline" className="text-xs">Custom</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {node.lat.toFixed(4)}, {node.lng.toFixed(4)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{node.capacity.toLocaleString()}L</div>
                          {node.production && (
                            <div className="text-xs text-muted-foreground">
                              {node.production.toLocaleString()}L/day
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{node.district}</TableCell>
                      <TableCell>
                        <Badge variant={node.isVisible ? "default" : "secondary"}>
                          {node.isVisible ? "Visible" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onNodeVisibilityToggle(node.id)}
                          >
                            {node.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditNode(node)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {node.isCustom && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteNode(node.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
          
          {nodes.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Nodes Available</h3>
              <p className="text-muted-foreground">Add your first network node to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          <strong>Node Management Tips:</strong> Use coordinates for precise placement. 
          Bangalore coordinates: Lat 12.9716, Lng 77.5946. Custom nodes can be edited and deleted, 
          while demo nodes can only be hidden/shown. Capacity should reflect realistic values for each facility type.
        </AlertDescription>
      </Alert>
    </div>
  );
}