'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {api} from '@/trpc/react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from '@/components/ui/card';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import {ConditionsSelector} from '@/components/conditions-selector';

const onboardingSchema = z.object({
    age: z
        .number()
        .min(1, 'Age must be at least 1')
        .max(120, 'Age must be at most 120'),
    gender: z.string().min(1, 'Please select a gender'),
    conditionIds: z.array(z.string()).default([]),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingFormProps {
    onComplete: () => void;
}

export function OnboardingForm({onComplete}: OnboardingFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

    const createProfile = api.profile.createProfile.useMutation({
        onSuccess: () => {
            onComplete();
        },
        onError: (error) => {
            console.error('Failed to create profile:', error);
        },
    });

    const form = useForm({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            age: 0,
            gender: '',
            conditionIds: [],
        },
    });

    const onSubmit = async (data: OnboardingFormData) => {
        setIsSubmitting(true);
        try {
            await createProfile.mutateAsync({
                ...data,
                conditionIds: selectedConditions,
            });
        } catch (error) {
            console.error('Error creating profile:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
            <Card className='w-full max-w-md'>
                <CardHeader className='text-center'>
                    <CardTitle className='text-2xl font-bold'>
                        Welcome to Cliniq Care
                    </CardTitle>
                    <CardDescription>
                        Let's get you set up with your profile information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                            <FormField
                                control={form.control}
                                name='age'
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Age</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                placeholder='Enter your age'
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(parseInt(e.target.value) || 0)
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='gender'
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder='Select your gender'/>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value='male'>Male</SelectItem>
                                                <SelectItem value='female'>Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormItem>
                                <FormLabel>Medical Conditions (Optional)</FormLabel>
                                <FormControl>
                                    <ConditionsSelector
                                        selectedConditions={selectedConditions}
                                        onSelectionChange={setSelectedConditions}
                                        placeholder='Search for conditions...'
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>

                            <Button type='submit' className='w-full' disabled={isSubmitting}>
                                {isSubmitting ? 'Creating Profile...' : 'Complete Onboarding'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
