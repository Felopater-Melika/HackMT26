'use client';

import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useRouter} from 'next/navigation';
import {api} from '@/trpc/react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from '@/components/ui/card';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import {ConditionsSelector} from '@/components/conditions-selector';
import {Separator} from '@/components/ui/separator';

const profileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    age: z
        .number()
        .min(1, 'Age must be at least 1')
        .max(120, 'Age must be at most 120'),
    gender: z.string().min(1, 'Please select a gender'),
    conditionIds: z.array(z.string()).default([]),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
    const router = useRouter();

    const {data: profile, isLoading: profileLoading} =
        api.profile.getProfile.useQuery();
    const {data: userConditions = []} =
        api.conditions.getUserConditions.useQuery();

    const updateProfile = api.profile.updateProfile.useMutation({
        onSuccess: () => {
            // Redirect to /app after successful update
            router.push('/app');
        },
        onError: (error) => {
            console.error('Failed to update profile:', error);
        },
    });

    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            age: 0,
            gender: '',
            conditionIds: [],
        },
    });

    // Update form when profile data loads
    useEffect(() => {
        if (profile) {
            const formData = {
                name: profile.name || '',
                age: profile.age || 0,
                gender: profile.gender || '',
                conditionIds: userConditions.map((c) => c.id),
            };
            console.log('Setting form data:', formData); // Debug log
            form.reset(formData);
            setSelectedConditions(userConditions.map((c) => c.id));
        }
    }, [profile, userConditions, form]);

    const onSubmit = async (data: ProfileFormData) => {
        setIsSubmitting(true);
        try {
            await updateProfile.mutateAsync({
                name: data.name,
                age: data.age,
                gender: data.gender,
                conditionIds: selectedConditions,
            });
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (profileLoading) {
        return (
            <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
                <div className='max-w-2xl mx-auto'>
                    <div className='animate-pulse'>
                        <div className='h-8 bg-gray-200 rounded w-1/4 mb-6'></div>
                        <div className='bg-white rounded-lg shadow p-6'>
                            <div className='space-y-4'>
                                <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                                <div className='h-10 bg-gray-200 rounded'></div>
                                <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                                <div className='h-10 bg-gray-200 rounded'></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-2xl mx-auto'>
                <div className='mb-8'>
                    <h1 className='text-3xl font-bold text-gray-900'>Profile Settings</h1>
                    <p className='mt-2 text-gray-600'>
                        Update your personal information and medical conditions
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Update your basic profile information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className='space-y-6'>
                                <FormField
                                    control={form.control}
                                    name='name'
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder='Enter your name' {...field} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

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
                                    render={({field}) => {
                                        console.log('Gender field value:', field.value); // Debug log
                                        return (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder='Select your gender'/>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value='male'>Male</SelectItem>
                                                        <SelectItem value='female'>Female</SelectItem>
                                                        <SelectItem value='other'>Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage/>
                                            </FormItem>
                                        );
                                    }}
                                />

                                <Separator/>

                                <FormItem>
                                    <FormLabel>Medical Conditions</FormLabel>
                                    <FormControl>
                                        <ConditionsSelector
                                            selectedConditions={selectedConditions}
                                            onSelectionChange={setSelectedConditions}
                                            placeholder='Search for conditions...'
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>

                                <Button type='submit' disabled={isSubmitting}>
                                    {isSubmitting ? 'Updating Profile...' : 'Update Profile'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
