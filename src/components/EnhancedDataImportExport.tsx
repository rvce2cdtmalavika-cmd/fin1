
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDairyData } from '@/hooks/useDairyData';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Database,
  FileSpreadsheet
} from 'lucide-react';

export function EnhancedDataImportExport() {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [validatedData, setValidatedData] = useState<any[]>([]);
  
  const { nodes, routes } = useDairyData();
  const { toast } = useToast();

  // Required CSV headers for each entity type
  const csvHeaders = {
    farms: [
      'name',
      'district',
      'latitude',
      'longitude',
      'daily_production_liters',
      'contact_person',
      'phone',
      'milk_quality_grade'
    ],
    collection_centers: [
      'name',
      'district',
      'latitude',
      'longitude',
      'storage_capacity_liters',
      'contact_person',
      'phone',
      'cooling_facility'
    ],
    processing_plants: [
      'name',
      'district',
      'latitude',
      'longitude',
      'processing_capacity_liters_per_day',
      'contact_person',
      'phone',
      'plant_type'
    ],
    routes: [
      'from_location_name',
      'to_location_name',
      'vehicle_type',
      'distance_km',
      'estimated_time_hours',
      'cost_per_trip',
      'frequency_per_day'
    ]
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportStatus('idle');
      setImportErrors([]);
      setValidatedData([]);
    }
  };

  const validateCSV = async (file: File, type: keyof typeof csvHeaders) => {
    return new Promise<{ isValid: boolean; errors: string[]; data: any[] }>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            resolve({ isValid: false, errors: ['CSV file must contain at least a header and one data row'], data: [] });
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const requiredHeaders = csvHeaders[type];
          const errors: string[] = [];
          const data: any[] = [];

          // Check required headers
          const missingHeaders = requiredHeaders.filter(req => !headers.includes(req.toLowerCase()));
          if (missingHeaders.length > 0) {
            errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
          }

          // Validate data rows
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: any = {};
            
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });

            // Validate required fields
            const rowErrors: string[] = [];
            
            // Check for empty required fields
            requiredHeaders.forEach(req => {
              if (!row[req.toLowerCase()]) {
                rowErrors.push(`Row ${i}: Missing ${req}`);
              }
            });

            // Validate data types
            if (type !== 'routes') {
              if (row.latitude && (isNaN(parseFloat(row.latitude)) || Math.abs(parseFloat(row.latitude)) > 90)) {
                rowErrors.push(`Row ${i}: Invalid latitude`);
              }
              if (row.longitude && (isNaN(parseFloat(row.longitude)) || Math.abs(parseFloat(row.longitude)) > 180)) {
                rowErrors.push(`Row ${i}: Invalid longitude`);
              }
            }

            if (rowErrors.length > 0) {
              errors.push(...rowErrors);
            } else {
              data.push(row);
            }
          }

          resolve({ isValid: errors.length === 0, errors, data });
        } catch (error) {
          resolve({ isValid: false, errors: ['Failed to parse CSV file'], data: [] });
        }
      };
      reader.readAsText(file);
    });
  };

  const processImport = async (type: keyof typeof csvHeaders) => {
    if (!importFile) return;

    setImportStatus('processing');
    
    try {
      const validation = await validateCSV(importFile, type);
      
      if (!validation.isValid) {
        setImportErrors(validation.errors);
        setImportStatus('error');
        return;
      }

      setValidatedData(validation.data);
      setImportStatus('success');
      
      toast({
        title: "Import Successful",
        description: `Successfully validated ${validation.data.length} ${type} records`,
      });

    } catch (error) {
      setImportErrors(['Failed to process import file']);
      setImportStatus('error');
      toast({
        title: "Import Failed",
        description: "Failed to process the import file",
        variant: "destructive"
      });
    }
  };

  const downloadTemplate = (type: keyof typeof csvHeaders) => {
    const headers = csvHeaders[type];
    const sampleData = getSampleData(type);
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_template.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getSampleData = (type: keyof typeof csvHeaders) => {
    const samples = {
      farms: [
        {
          name: 'Shree Krishna Dairy Farm',
          district: 'Mandya',
          latitude: '12.5216',
          longitude: '76.8956',
          daily_production_liters: '500',
          contact_person: 'Rajesh Kumar',
          phone: '9876543210',
          milk_quality_grade: 'A'
        },
        {
          name: 'Nandini Milk Producers',
          district: 'Hassan',
          latitude: '13.0080',
          longitude: '76.1004',
          daily_production_liters: '750',
          contact_person: 'Priya Sharma',
          phone: '9876543211',
          milk_quality_grade: 'A+'
        }
      ],
      collection_centers: [
        {
          name: 'Mandya Collection Center',
          district: 'Mandya',
          latitude: '12.5266',
          longitude: '76.8950',
          storage_capacity_liters: '5000',
          contact_person: 'Suresh Babu',
          phone: '9876543212',
          cooling_facility: 'Yes'
        }
      ],
      processing_plants: [
        {
          name: 'Karnataka Milk Federation Plant',
          district: 'Bangalore Rural',
          latitude: '12.9716',
          longitude: '77.5946',
          processing_capacity_liters_per_day: '50000',
          contact_person: 'Dr. Anitha Rao',
          phone: '9876543213',
          plant_type: 'Pasteurization'
        }
      ],
      routes: [
        {
          from_location_name: 'Shree Krishna Dairy Farm',
          to_location_name: 'Mandya Collection Center',
          vehicle_type: 'milk_tanker',
          distance_km: '15',
          estimated_time_hours: '0.5',
          cost_per_trip: '450',
          frequency_per_day: '2'
        }
      ]
    };
    return samples[type];
  };

  const exportData = (type: keyof typeof csvHeaders) => {
    let dataToExport: any[] = [];
    
    if (type === 'farms') {
      dataToExport = nodes.filter(n => n.type === 'farm').map(node => ({
        name: node.name,
        district: node.district,
        latitude: node.lat,
        longitude: node.lng,
        daily_production_liters: node.capacity,
        contact_person: node.contact || '',
        phone: node.phone || '',
        milk_quality_grade: 'A'
      }));
    } else if (type === 'collection_centers') {
      dataToExport = nodes.filter(n => n.type === 'collection_center').map(node => ({
        name: node.name,
        district: node.district,
        latitude: node.lat,
        longitude: node.lng,
        storage_capacity_liters: node.capacity,
        contact_person: node.contact || '',
        phone: node.phone || '',
        cooling_facility: 'Yes'
      }));
    } else if (type === 'processing_plants') {
      dataToExport = nodes.filter(n => n.type === 'processing_plant').map(node => ({
        name: node.name,
        district: node.district,
        latitude: node.lat,
        longitude: node.lng,
        processing_capacity_liters_per_day: node.capacity,
        contact_person: node.contact || '',
        phone: node.phone || '',
        plant_type: 'Pasteurization'
      }));
    } else if (type === 'routes') {
      dataToExport = routes.map(route => ({
        from_location_name: route.from_id,
        to_location_name: route.to_id,
        vehicle_type: route.vehicle_type,
        distance_km: route.distance_km,
        estimated_time_hours: route.estimated_time_hours,
        cost_per_trip: route.cost_per_trip,
        frequency_per_day: 2
      }));
    }

    if (dataToExport.length === 0) {
      toast({
        title: "No Data",
        description: `No ${type} data available to export`,
        variant: "destructive"
      });
      return;
    }

    const headers = csvHeaders[type];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `karnataka_dairy_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${dataToExport.length} ${type} records`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Karnataka Dairy Network Data Management
          </CardTitle>
          <CardDescription>
            Import and export dairy network data with specific CSV formats for Karnataka region
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates & Headers</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(csvHeaders).map(([type, headers]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="capitalize flex items-center justify-between">
                    {type.replace('_', ' ')}
                    <Button onClick={() => downloadTemplate(type as keyof typeof csvHeaders)} size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Required CSV Headers:</Label>
                    <div className="grid grid-cols-2 gap-1">
                      {headers.map((header, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {header}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import CSV Data</CardTitle>
              <CardDescription>
                Upload CSV files with the exact headers specified in the templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="import-file">Select CSV File</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>

              {importFile && (
                <div className="space-y-4">
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.keys(csvHeaders).map((type) => (
                      <Button 
                        key={type} 
                        onClick={() => processImport(type as keyof typeof csvHeaders)}
                        disabled={importStatus === 'processing'}
                        size="sm"
                        className="capitalize"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import {type.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {importStatus === 'processing' && (
                <Alert>
                  <div className="animate-spin h-4 w-4 border-b-2 border-primary mr-2"></div>
                  <AlertDescription>Processing import file...</AlertDescription>
                </Alert>
              )}

              {importStatus === 'success' && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Successfully validated {validatedData.length} records. Data is ready for import.
                  </AlertDescription>
                </Alert>
              )}

              {importStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>Import failed with the following errors:</p>
                      <ul className="list-disc list-inside text-sm">
                        {importErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(csvHeaders).map((type) => {
              const count = type === 'routes' 
                ? routes.length 
                : nodes.filter(n => n.type === type.slice(0, -1)).length;

              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="capitalize flex items-center justify-between">
                      {type.replace('_', ' ')}
                      <Badge variant="secondary">{count} records</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => exportData(type as keyof typeof csvHeaders)}
                      disabled={count === 0}
                      className="w-full"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export {type.replace('_', ' ')} CSV
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>CSV Format Requirements:</strong> All CSV files must include the exact headers shown in templates. 
          Latitude/longitude must be valid coordinates for Karnataka region (approximately 11.5°-18.5°N, 74°-78.5°E).
          Sample data is provided in downloadable templates.
        </AlertDescription>
      </Alert>
    </div>
  );
}
