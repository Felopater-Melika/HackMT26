'use client';

import {useState} from 'react';
import {Check, ChevronsUpDown, Plus} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from '@/components/ui/command';
import {Popover, PopoverContent, PopoverTrigger,} from '@/components/ui/popover';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {api} from '@/trpc/react';

interface Condition {
    id: string;
    name: string;
    description: string | null;
    source: string | null;
    createdBy: string | null;
    isVerified: boolean | null;
}

interface ConditionsSelectorProps {
    selectedConditions: string[];
    onSelectionChange: (conditionIds: string[]) => void;
    placeholder?: string;
}

export function ConditionsSelector({
                                       selectedConditions,
                                       onSelectionChange,
                                       placeholder = 'Search conditions...',
                                   }: ConditionsSelectorProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [customConditionName, setCustomConditionName] = useState('');
    const [customConditionDescription, setCustomConditionDescription] =
        useState('');
    const [isCreatingCustom, setIsCreatingCustom] = useState(false);

    const {data: conditions = [], isLoading} = api.conditions.search.useQuery(
        {query: searchQuery},
        {
            enabled: searchQuery.length > 0,
        }
    );

    // Use prioritized list for picker (user-created first, then verified, then name)
    const {data: allConditions = []} =
        api.conditions.getAllForPicker.useQuery();

    const createCustomCondition =
        api.conditions.createCustomCondition.useMutation({
            onSuccess: (newCondition) => {
                // Add the new condition to selected conditions
                onSelectionChange([...selectedConditions, newCondition?.id ?? '']);
                setCustomConditionName('');
                setCustomConditionDescription('');
                setIsCreatingCustom(false);
            },
            onError: (error) => {
                console.error('Failed to create custom condition:', error);
            },
        });

    // Show full prioritized list when no search; do not slice
    const displayConditions = searchQuery.length > 0 ? conditions : allConditions;

    const selectedConditionNames = selectedConditions
        .map((conditionId) => {
            const condition = [...conditions, ...allConditions].find(
                (c) => c.id === conditionId
            );
            return condition?.name || '';
        })
        .filter(Boolean);

    const toggleCondition = (conditionId: string) => {
        if (selectedConditions.includes(conditionId)) {
            onSelectionChange(selectedConditions.filter((id) => id !== conditionId));
        } else {
            onSelectionChange([...selectedConditions, conditionId]);
        }
    };

    const handleCreateCustomCondition = async () => {
        if (!customConditionName.trim()) return;

        try {
            await createCustomCondition.mutateAsync({
                name: customConditionName.trim(),
                description: customConditionDescription.trim() || undefined,
            });
        } catch (error) {
            console.error('Error creating custom condition:', error);
        }
    };

    const handleAddCustomClick = () => {
        // Pre-fill with search query if available
        if (searchQuery.trim()) {
            setCustomConditionName(searchQuery.trim());
        }
        setIsCreatingCustom(true);
        setOpen(false);
    };

    return (
        <div className='space-y-2'>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant='outline'
                        role='combobox'
                        aria-expanded={open}
                        className='w-full justify-between'>
                        {selectedConditionNames.length > 0
                            ? `${selectedConditionNames.length} condition${selectedConditionNames.length > 1 ? 's' : ''} selected`
                            : placeholder}
                        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50'/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className='w-full p-0' align='start'>
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder='Search conditions...'
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            <CommandEmpty>
                                {isLoading ? (
                                    <div className='py-6 text-center text-sm'>Searching...</div>
                                ) : (
                                    <div className='flex flex-col items-center justify-center py-6 px-4 text-sm'>
                                        <p className='text-gray-600 mb-4 text-center'>
                                            "{searchQuery}" wasn't found. Would you like to add it?
                                        </p>
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={handleAddCustomClick}
                                            className='w-full max-w-full'>
                                            <Plus className='mr-2 h-4 w-4 flex-shrink-0'/>
                                            <span>Add condition</span>
                                        </Button>
                                    </div>
                                )}
                            </CommandEmpty>
                            <CommandGroup>
                                {displayConditions.map((condition) => (
                                    <CommandItem
                                        key={condition.id}
                                        value={condition.id}
                                        onSelect={() => toggleCondition(condition.id)}>
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                selectedConditions.includes(condition.id)
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
                                            )}
                                        />
                                        <div className='flex flex-col'>
                                            <span>{condition.name}</span>
                                            {condition.description && (
                                                <span className='text-sm text-gray-500'>
                          {condition.description}
                        </span>
                                            )}
                                            {condition.source === 'user' && (
                                                <span className='text-xs text-blue-600'>
                          Custom condition
                        </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Dialog open={isCreatingCustom} onOpenChange={setIsCreatingCustom}>
                <DialogContent className='sm:max-w-[425px]'>
                    <DialogHeader>
                        <DialogTitle>Add Custom Condition</DialogTitle>
                        <DialogDescription>
                            Add a medical condition that's not in our database.
                        </DialogDescription>
                    </DialogHeader>
                    <div className='grid gap-4 py-4'>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='condition-name' className='text-right'>
                                Name *
                            </Label>
                            <Input
                                id='condition-name'
                                value={customConditionName}
                                onChange={(e) => setCustomConditionName(e.target.value)}
                                className='col-span-3'
                                placeholder='Enter condition name'
                            />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='condition-description' className='text-right'>
                                Description
                            </Label>
                            <Input
                                id='condition-description'
                                value={customConditionDescription}
                                onChange={(e) => setCustomConditionDescription(e.target.value)}
                                className='col-span-3'
                                placeholder='Optional description'
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => setIsCreatingCustom(false)}>
                            Cancel
                        </Button>
                        <Button
                            type='button'
                            onClick={handleCreateCustomCondition}
                            disabled={
                                !customConditionName.trim() || createCustomCondition.isPending
                            }>
                            {createCustomCondition.isPending ? 'Adding...' : 'Add Condition'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {selectedConditionNames.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                    {selectedConditionNames.map((name, index) => (
                        <span
                            key={index}
                            className='inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm'>
              {name}
                            <button
                                type='button'
                                onClick={() => {
                                    const conditionId = selectedConditions[index];
                                    onSelectionChange(
                                        selectedConditions.filter((id) => id !== conditionId)
                                    );
                                }}
                                className='ml-1 hover:bg-blue-200 rounded-full p-0.5'>
                ×
              </button>
            </span>
                    ))}
                </div>
            )}
        </div>
    );
}
