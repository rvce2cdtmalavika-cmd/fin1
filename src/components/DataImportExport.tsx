
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { dairyService } from '@/services/dairyService';
import { 
  Download, 
  Upload, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Table,
  FileSpreadsheet
} from 'lucide-react';

interface ImportedData {
  farms?: any[];
  plants?: any[];
  centers?: any[];
  routes?: any[];
}

interface ExportFormat {
  type: 'csv' | 'json' | 'excel';
  name: string;
  description: string;
  icon: React.ReactNode;
}

export function DataImportExport() {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importResults, setImportResults] = useState<ImportedData>({});
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const exportFormats: ExportFormat[] = [
    {
      type: 'csv',
      name: 'CSV Format',
      description: 'Compatible with Excel and Google Sheets',
      icon: <FileSpreadsheet className="h-4 w-4" />
    },
    {
      type: 'json',
      name: 'JSON Format',
      description: 'For technical users and API integration',
      icon: <FileText className="h-4 w-4" />
    },
    {
      type: 'excel',
      name: 'Excel Format',
      description: 'Native Excel workbook with multiple sheets',
      icon: <Table className="h-4 w-4" />
    }
  ];

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('idle');

    try {
      const text = await file.text();
      let data: ImportedData = {};

      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(text);
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV files.');
      }

      // Validate and import data
      await importDataToSupabase(data);
      
      setImportResults(data);
      setImportStatus('success');
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${getTotalRecords(data)} records`,
      });

    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const parseCSV = (csvText: string): ImportedData => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV file must have at least a header and one data row');

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        data.push(record);
      }
    }

    // Categorize data based on CSV content
    const result: ImportedData = {};
    
    if (headers.includes('daily_production_liters') || headers.includes('cattle_count')) {
      result.farms = data;
    } else if (headers.includes('processing_capacity_liters_per_day')) {
      result.plants = data;
    } else if (headers.includes('storage_capacity_liters')) {
      result.centers = data;
    } else if (headers.includes('route_name') || headers.includes('distance_km')) {
      result.routes = data;
    } else {
      // Generic import - try to detect based on content
      result.farms = data.filter(record => record.daily_production_liters || record.cattle_count);
      result.plants = data.filter(record => record.processing_capacity_liters_per_day);
      result.centers = data.filter(record => record.storage_capacity_liters);
      result.routes = data.filter(record => record.route_name || record.distance_km);
    }

    return result;
  };

  const importDataToSupabase = async (data: ImportedData) => {
    const promises = [];

    if (data.farms?.length) {
      promises.push(...data.farms.map(farm => dairyService.addDairyFarm({
        name: farm.name || 'Imported Farm',
        location_lat: parseFloat(farm.location_lat || farm.lat || '0'),
        location_lng: parseFloat(farm.location_lng || farm.lng || '0'),
        daily_production_liters: parseInt(farm.daily_production_liters || '1000'),
        cattle_count: parseInt(farm.cattle_count || '50'),
        farm_type: farm.farm_type || 'mixed',
        district: farm.district || 'Bangalore Rural',
        contact_person: farm.contact_person,
        phone: farm.phone,
        established_year: farm.established_year ? parseInt(farm.established_year) : undefined,
        organic_certified: farm.organic_certified === 'true' || farm.organic_certified === true,
        active: true
      })));
    }

    if (data.plants?.length) {
      promises.push(...data.plants.map(plant => dairyService.addProcessingPlant({
        name: plant.name || 'Imported Plant',
        location_lat: parseFloat(plant.location_lat || plant.lat || '0'),
        location_lng: parseFloat(plant.location_lng || plant.lng || '0'),
        processing_capacity_liters_per_day: parseInt(plant.processing_capacity_liters_per_day || '10000'),
        plant_type: plant.plant_type || 'pasteurization',
        products: Array.isArray(plant.products) ? plant.products : (plant.products || 'Fresh Milk').split(','),
        district: plant.district || 'Bangalore Urban',
        contact_person: plant.contact_person,
        phone: plant.phone,
        established_year: plant.established_year ? parseInt(plant.established_year) : undefined,
        certifications: Array.isArray(plant.certifications) ? plant.certifications : (plant.certifications || '').split(','),
        active: true
      })));
    }

    if (data.centers?.length) {
      promises.push(...data.centers.map(center => dairyService.addCollectionCenter({
        name: center.name || 'Imported Center',
        location_lat: parseFloat(center.location_lat || center.lat || '0'),
        location_lng: parseFloat(center.location_lng || center.lng || '0'),
        storage_capacity_liters: parseInt(center.storage_capacity_liters || '5000'),
        cooling_facility: center.cooling_facility === 'true' || center.cooling_facility === true,
        collection_schedule: center.collection_schedule || 'twice_daily',
        serves_villages: Array.isArray(center.serves_villages) ? center.serves_villages : (center.serves_villages || 'Village1').split(','),
        district: center.district || 'Bangalore Rural',
        contact_person: center.contact_person,
        phone: center.phone,
        active: true
      })));
    }

    await Promise.all(promises);
  };

  const getTotalRecords = (data: ImportedData): number => {
    return (data.farms?.length || 0) + 
           (data.plants?.length || 0) + 
           (data.centers?.length || 0) + 
           (data.routes?.length || 0);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const [farms, plants, centers, routes] = await Promise.all([
        dairyService.getDairyFarms(),
        dairyService.getProcessingPlants(),
        dairyService.getCollectionCenters(),
        dairyService.getTransportRoutes()
      ]);

      const exportData = {
        farms,
        processing_plants: plants,
        collection_centers: centers,
        transport_routes: routes,
        exported_at: new Date().toISOString(),
        export_format: exportFormat
      };

      if (exportFormat === 'json') {
        downloadJSON(exportData, 'dairy_network_data.json');
      } else if (exportFormat === 'csv') {
        downloadCSV(exportData);
      } else if (exportFormat === 'excel') {
        downloadExcel(exportData);
      }

      toast({
        title: "Export Successful",
        description: `Network data exported in ${exportFormat.toUpperCase()} format`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export network data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data: any) => {
    // Create separate CSV files for each data type
    const csvFiles = [
      { name: 'dairy_farms.csv', data: data.farms, type: 'farms' },
      { name: 'processing_plants.csv', data: data.processing_plants, type: 'plants' },
      { name: 'collection_centers.csv', data: data.collection_centers, type: 'centers' },
      { name: 'transport_routes.csv', data: data.transport_routes, type: 'routes' }
    ];

    csvFiles.forEach(file => {
      if (file.data.length > 0) {
        const headers = Object.keys(file.data[0]);
        const csvContent = [
          headers.join(','),
          ...file.data.map(row => 
            headers.map(header => {
              const value = row[header];
              if (Array.isArray(value)) return `"${value.join(';')}"`;
              return `"${value || ''}"`;
            }).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const downloadExcel = (data: any) => {
    // For now, download as multiple CSV files
    // In a real implementation, you'd use a library like xlsx
    downloadCSV(data);
    toast({
      title: "Excel Export",
      description: "Excel format exported as multiple CSV files. Use a library like xlsx for native Excel support.",
      variant: "default"
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Import & Export
          </CardTitle>
          <CardDescription>
            Import existing dairy network data or export your current network configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Import Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Import Data</h3>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Supported formats: JSON, CSV. Files should contain dairy farm, processing plant, 
                collection center, or transport route data with appropriate headers.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-4">
              <Button onClick={triggerFileInput} disabled={isImporting}>
                {isImporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isImporting ? 'Importing...' : 'Select File to Import'}
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileImport}
                className="hidden"
              />

              {importStatus === 'success' && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Import Successful
                </Badge>
              )}

              {importStatus === 'error' && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Import Failed
                </Badge>
              )}
            </div>

            {importResults && getTotalRecords(importResults) > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Import Summary:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {importResults.farms && (
                    <div>Farms: {importResults.farms.length} imported</div>
                  )}
                  {importResults.plants && (
                    <div>Processing Plants: {importResults.plants.length} imported</div>
                  )}
                  {importResults.centers && (
                    <div>Collection Centers: {importResults.centers.length} imported</div>
                  )}
                  {importResults.routes && (
                    <div>Transport Routes: {importResults.routes.length} imported</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Export Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Export Data</h3>
            </div>

            <div className="space-y-3">
              <Label>Export Format:</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {exportFormats.map((format) => (
                  <div
                    key={format.type}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      exportFormat === format.type
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setExportFormat(format.type)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {format.icon}
                      <span className="font-medium">{format.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{format.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleExport} disabled={isExporting} className="w-full">
              {isExporting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting ? 'Exporting...' : `Export Network Data as ${exportFormat.toUpperCase()}`}
            </Button>
          </div>

          {/* Sample Data Templates */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Sample Templates</h3>
            </div>
            
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Download sample CSV templates to understand the required data format for imports.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadSampleTemplate('farms')}>
                Farm Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadSampleTemplate('plants')}>
                Plant Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadSampleTemplate('centers')}>
                Center Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadSampleTemplate('routes')}>
                Route Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  function downloadSampleTemplate(type: string) {
    const templates = {
      farms: `name,location_lat,location_lng,daily_production_liters,cattle_count,farm_type,district,contact_person,phone,organic_certified
Sample Farm,12.9716,77.5946,5000,100,mixed,Bangalore Rural,John Doe,+91-9876543210,true`,
      plants: `name,location_lat,location_lng,processing_capacity_liters_per_day,plant_type,products,district,contact_person,phone
Sample Plant,12.9716,77.5946,50000,pasteurization,"Fresh Milk,Curd",Bangalore Urban,Jane Smith,+91-9876543211`,
      centers: `name,location_lat,location_lng,storage_capacity_liters,cooling_facility,collection_schedule,serves_villages,district,contact_person,phone
Sample Center,12.9716,77.5946,10000,true,twice_daily,"Village1,Village2",Bangalore Rural,Bob Johnson,+91-9876543212`,
      routes: `route_name,from_type,from_id,to_type,to_id,distance_km,estimated_time_hours,vehicle_type,cost_per_trip
Sample Route,farm,farm-1,collection_center,center-1,15.5,0.5,milk_tanker,500`
    };

    const csvContent = templates[type as keyof typeof templates];
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
