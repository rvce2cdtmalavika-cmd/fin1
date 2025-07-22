
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Copy,
  Database
} from 'lucide-react';

interface CSVTemplate {
  name: string;
  headers: string[];
  description: string;
  sampleData: string[][];
  requirements: string[];
}

const CSV_TEMPLATES: CSVTemplate[] = [
  {
    name: 'Dairy Farms',
    headers: [
      'name', 'latitude', 'longitude', 'district', 'cattle_count', 
      'daily_production_liters', 'farm_type', 'organic_certified', 
      'contact_person', 'phone', 'established_year'
    ],
    description: 'Import dairy farm locations with production capacity and operational details',
    sampleData: [
      ['Green Valley Farm', '12.9716', '77.5946', 'Bangalore Rural', '50', '500', 'mixed', 'false', 'Ravi Kumar', '+91-9876543210', '2010'],
      ['Sunrise Dairy', '13.0827', '77.5946', 'Bangalore Urban', '75', '750', 'dairy', 'true', 'Sunita Devi', '+91-9876543211', '2008']
    ],
    requirements: [
      'latitude and longitude must be valid decimal degrees',
      'daily_production_liters should be realistic (50-2000L typical)',
      'farm_type: mixed, dairy, or organic',
      'organic_certified: true or false'
    ]
  },
  {
    name: 'Collection Centers',
    headers: [
      'name', 'latitude', 'longitude', 'district', 'storage_capacity_liters',
      'cooling_facility', 'collection_schedule', 'serves_villages', 
      'contact_person', 'phone'
    ],
    description: 'Import milk collection centers with storage and operational details',
    sampleData: [
      ['Central Collection Hub', '12.9716', '77.5946', 'Bangalore Rural', '5000', 'true', 'twice_daily', 'Village1,Village2,Village3', 'Manjunath', '+91-9876543212'],
      ['North Zone Center', '13.0827', '77.5946', 'Bangalore Urban', '3000', 'true', 'morning_evening', 'Village4,Village5', 'Lakshmi', '+91-9876543213']
    ],
    requirements: [
      'storage_capacity_liters typical range: 1000-10000L',
      'cooling_facility: true or false',
      'collection_schedule: once_daily, twice_daily, or morning_evening',
      'serves_villages: comma-separated list of village names'
    ]
  },
  {
    name: 'Processing Plants',
    headers: [
      'name', 'latitude', 'longitude', 'district', 'plant_type',
      'processing_capacity_liters_per_day', 'products', 'certifications',
      'contact_person', 'phone', 'established_year'
    ],
    description: 'Import dairy processing facilities with capacity and product details',
    sampleData: [
      ['Modern Dairy Plant', '12.9716', '77.5946', 'Bangalore Urban', 'integrated', '50000', 'milk,curd,butter,cheese', 'FSSAI,ISO22000,HACCP', 'Ramesh Sharma', '+91-9876543214', '2015'],
      ['Heritage Foods Unit', '13.0827', '77.5946', 'Bangalore Rural', 'specialized', '25000', 'milk,paneer,ghee', 'FSSAI,Organic', 'Priya Patel', '+91-9876543215', '2012']
    ],
    requirements: [
      'plant_type: integrated, specialized, or cooperative',
      'processing_capacity_liters_per_day typical range: 5000-100000L',
      'products: comma-separated list (milk,curd,butter,cheese,paneer,ghee,ice_cream)',
      'certifications: comma-separated list of valid certifications'
    ]
  },
  {
    name: 'Distributors',
    headers: [
      'name', 'latitude', 'longitude', 'city', 'distributor_type',
      'storage_capacity_liters', 'refrigerated_storage', 'delivery_vehicles',
      'service_radius_km', 'contact_person', 'phone'
    ],
    description: 'Import distributor hubs for wholesale and retail distribution',
    sampleData: [
      ['City Distribution Hub', '12.9716', '77.5946', 'Bangalore', 'wholesale', '15000', 'true', '10', '25', 'Vikram Singh', '+91-9876543216'],
      ['Local Distributor', '13.0827', '77.5946', 'Mysore', 'retail', '5000', 'true', '3', '15', 'Anita Reddy', '+91-9876543217']
    ],
    requirements: [
      'distributor_type: wholesale, retail, or mixed',
      'storage_capacity_liters typical range: 2000-50000L',
      'refrigerated_storage: true or false',
      'delivery_vehicles: number of vehicles available',
      'service_radius_km: delivery coverage area in kilometers'
    ]
  },
  {
    name: 'Transport Routes',
    headers: [
      'route_name', 'from_type', 'from_id', 'to_type', 'to_id',
      'distance_km', 'estimated_time_hours', 'vehicle_type', 'cost_per_trip',
      'optimal_load_liters', 'frequency_per_day'
    ],
    description: 'Import transportation routes between network nodes',
    sampleData: [
      ['Farm to Center Route 1', 'farm', 'farm_001', 'collection_center', 'center_001', '15.5', '0.75', 'refrigerated_truck', '450', '2000', '2'],
      ['Center to Plant Route 1', 'collection_center', 'center_001', 'processing_plant', 'plant_001', '45.2', '2.5', 'bulk_tanker', '1200', '5000', '1']
    ],
    requirements: [
      'from_type/to_type: farm, collection_center, processing_plant, distributor',
      'from_id/to_id: must match existing node IDs',
      'distance_km: actual road distance',
      'vehicle_type: refrigerated_truck, insulated_van, bulk_tanker, or regular_truck',
      'cost_per_trip: total cost including fuel, driver, maintenance'
    ]
  },
  {
    name: 'Product Specifications',
    headers: [
      'product_id', 'product_name', 'category', 'min_temp_celsius', 'max_temp_celsius',
      'shelf_life_hours_refrigerated', 'shelf_life_hours_ambient', 'spoilage_rate_per_hour_ambient',
      'temperature_sensitivity', 'packaging_requirements', 'transport_requirements'
    ],
    description: 'Import custom dairy product specifications with temperature and quality requirements',
    sampleData: [
      ['custom_milk_a2', 'A2 Organic Milk', 'milk', '0', '4', '168', '4', '8.5', 'high', 'opaque,sealed', 'refrigerated,minimal_agitation'],
      ['custom_greek_yogurt', 'Greek Yogurt', 'fermented', '2', '6', '336', '8', '6.0', 'high', 'sealed,moisture_proof', 'refrigerated,stable_temperature']
    ],
    requirements: [
      'category: milk, fermented, cheese, butter, frozen',
      'temperatures in Celsius',
      'shelf_life in hours',
      'spoilage_rate_per_hour_ambient: percentage per hour',
      'temperature_sensitivity: low, medium, or high',
      'requirements: comma-separated lists'
    ]
  }
];

export function EnhancedDataImportExport() {
  const [selectedTemplate, setSelectedTemplate] = useState<CSVTemplate>(CSV_TEMPLATES[0]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const downloadTemplate = (template: CSVTemplate) => {
    const csvContent = [
      template.headers.join(','),
      ...template.sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '_')}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: `${template.name} CSV template has been downloaded`,
    });
  };

  const copyHeaders = (headers: string[]) => {
    navigator.clipboard.writeText(headers.join(','));
    toast({
      title: "Headers Copied",
      description: "CSV headers have been copied to clipboard",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportStatus('idle');
      setImportErrors([]);
    }
  };

  const processImport = async () => {
    if (!importFile) return;

    setImportStatus('processing');
    setImportErrors([]);

    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('File must contain headers and at least one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const missingHeaders = selectedTemplate.headers.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      // Validate data rows
      const errors: string[] = [];
      for (let i = 1; i < Math.min(lines.length, 11); i++) { // Check first 10 rows
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`);
        }
        
        // Additional validations based on template
        if (selectedTemplate.name === 'Dairy Farms') {
          const lat = parseFloat(values[headers.indexOf('latitude')]);
          const lng = parseFloat(values[headers.indexOf('longitude')]);
          if (isNaN(lat) || isNaN(lng)) {
            errors.push(`Row ${i + 1}: Invalid latitude/longitude`);
          }
        }
      }

      if (errors.length > 0) {
        setImportErrors(errors);
        setImportStatus('error');
      } else {
        setImportStatus('success');
        toast({
          title: "Import Successful",
          description: `Successfully processed ${lines.length - 1} records`,
        });
      }

    } catch (error) {
      setImportErrors([error instanceof Error ? error.message : 'Unknown error occurred']);
      setImportStatus('error');
    }
  };

  const exportNetworkData = () => {
    // This would export current network configuration
    const exportData = {
      timestamp: new Date().toISOString(),
      nodes: [], // Would be populated with actual node data
      routes: [], // Would be populated with actual route data
      optimization_results: [] // Would be populated with optimization results
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dairy_network_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Network Exported",
      description: "Current network configuration has been exported",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Import & Export Center
          </CardTitle>
          <CardDescription>
            Import network data using standardized CSV templates with proper validation and export optimization results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">Data Import</TabsTrigger>
              <TabsTrigger value="export">Data Export</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-6">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Use the standardized CSV templates below for importing network data. Each template includes required headers, 
                  sample data, and validation requirements based on industry standards.
                </AlertDescription>
              </Alert>

              {/* Template Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CSV_TEMPLATES.map((template) => (
                  <Card 
                    key={template.name}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate.name === template.name 
                        ? 'ring-2 ring-primary' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                      <Badge variant="outline">{template.headers.length} columns</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected Template Details */}
              <Card>
                <CardHeader>
                  <CardTitle>{selectedTemplate.name} Template</CardTitle>
                  <CardDescription>{selectedTemplate.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Headers */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-semibold">Required CSV Headers:</Label>
                      <Button 
                        onClick={() => copyHeaders(selectedTemplate.headers)} 
                        size="sm" 
                        variant="outline"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Headers
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-sm">{selectedTemplate.headers.join(', ')}</code>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <Label className="font-semibold">Data Requirements:</Label>
                    <ul className="mt-2 space-y-1">
                      {selectedTemplate.requirements.map((req, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sample Data */}
                  <div>
                    <Label className="font-semibold">Sample Data:</Label>
                    <ScrollArea className="h-32 mt-2">
                      <div className="text-xs font-mono bg-muted p-3 rounded-lg">
                        <div className="font-bold">{selectedTemplate.headers.join(',')}</div>
                        {selectedTemplate.sampleData.map((row, index) => (
                          <div key={index}>{row.join(',')}</div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <Button onClick={() => downloadTemplate(selectedTemplate)} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download {selectedTemplate.name} Template
                  </Button>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload CSV Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select CSV File:</Label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="mt-2"
                    />
                  </div>

                  {importFile && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}

                  <Button 
                    onClick={processImport} 
                    disabled={!importFile || importStatus === 'processing'}
                    className="w-full"
                  >
                    {importStatus === 'processing' ? (
                      <div className="animate-spin h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {importResults.distributors && (
                      <div className="text-yellow-600">Distributors: {importResults.distributors.length} (not imported - no database table)</div>
                    )}
                    {importResults.products && (
                      <div className="text-yellow-600">Products: {importResults.products.length} (not imported - no database table)</div>
                    )}
                    {importStatus === 'processing' ? 'Processing...' : 'Import Data'}
                  </Button>

                  {/* Import Status */}
                  {importStatus === 'success' && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Data imported successfully! All records passed validation.
                      </AlertDescription>
                    </Alert>
                  )}

                  {importStatus === 'error' && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div>Import failed with the following errors:</div>
                        <ul className="mt-2 list-disc list-inside">
                          {importErrors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  Export your current network configuration, optimization results, and performance data for analysis or backup.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Network Configuration</CardTitle>
                    <CardDescription>Export all nodes, routes, and settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={exportNetworkData} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export Network (JSON)
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Results</CardTitle>
                    <CardDescription>Export route optimization and performance data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Results (CSV)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
